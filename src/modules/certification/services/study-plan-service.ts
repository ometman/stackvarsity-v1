import "server-only";
import { requireRole } from "@/modules/auth/rbac";
import {
  createStudyPlanSchema,
  rescheduleStudyPlanSchema,
  toggleStudyTaskSchema,
} from "@/modules/certification/schemas/study-plan-schemas";
import { CertificationServiceError } from "@/modules/certification/services/track-errors";
import { getDb } from "@/server/db";

/**
 * Computes a deterministic UTC due date offset by (weekNumber - 1) * 7 calendar days
 * from startDate, normalized to noon UTC so date-boundary/DST shifts never flip the calendar day.
 */
export function computeTaskDueDate(startDate: Date, weekNumber: number): Date {
  const safeWeek = Math.max(1, weekNumber);
  const utcNoon = Date.UTC(
    startDate.getUTCFullYear(),
    startDate.getUTCMonth(),
    startDate.getUTCDate() + (safeWeek - 1) * 7,
    12,
    0,
    0,
    0
  );
  return new Date(utcNoon);
}

export function formatDueDateInTimezone(date: Date, timezone: string): string {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

async function ensureActiveTemplateForTrack(trackId: string) {
  const db = getDb();
  const existing = await db.studyPlanTemplate.findFirst({
    where: { trackId, isActive: true },
    orderBy: { version: "desc" },
    include: { tasks: { orderBy: [{ weekNumber: "asc" }, { position: "asc" }] } },
  });
  if (existing) {
    return existing;
  }

  const track = await db.preparationTrack.findUnique({
    where: { id: trackId },
    include: {
      examVersion: {
        include: {
          domains: {
            orderBy: { position: "asc" },
            include: { objectives: { orderBy: { position: "asc" } } },
          },
        },
      },
    },
  });

  if (!track) {
    throw new CertificationServiceError("Preparation track not found", 404, "NOT_FOUND");
  }

  const tasksToCreate: Array<{
    objectiveId: string;
    title: string;
    description: string | null;
    weekNumber: number;
    estimatedMinutes: number;
    position: number;
  }> = [];

  let pos = 1;
  track.examVersion.domains.forEach((domain, domainIndex) => {
    const weekNumber = domainIndex + 1;
    domain.objectives.forEach((obj) => {
      tasksToCreate.push({
        objectiveId: obj.id,
        title: `${obj.objectiveKey}: ${obj.title}`,
        description: obj.summary ?? null,
        weekNumber,
        estimatedMinutes: 45,
        position: pos++,
      });
    });
  });

  return db.studyPlanTemplate.create({
    data: {
      trackId,
      version: 1,
      title: `${track.title} — Standard Study Plan`,
      description: "Domain-by-domain preparation schedule.",
      estimatedWeeks: Math.max(1, track.examVersion.domains.length),
      isActive: true,
      tasks: {
        create: tasksToCreate,
      },
    },
    include: { tasks: { orderBy: [{ weekNumber: "asc" }, { position: "asc" }] } },
  });
}

export async function getLearnerStudyPlan(trackId: string) {
  const session = await requireRole(["STUDENT", "ADMIN"]);
  const db = getDb();

  const plan = await db.learnerStudyPlan.findUnique({
    where: {
      userId_trackId: {
        userId: session.user.id,
        trackId,
      },
    },
    include: {
      tasks: {
        orderBy: [{ dueDate: "asc" }, { position: "asc" }],
      },
    },
  });

  return plan;
}

export async function createOrGetLearnerStudyPlan(trackId: string, rawInput: unknown) {
  const session = await requireRole(["STUDENT", "ADMIN"]);
  const parsed = createStudyPlanSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new CertificationServiceError(
      parsed.error.issues[0]?.message ?? "Invalid study plan input",
      400,
      "VALIDATION_ERROR"
    );
  }

  const db = getDb();
  const enrollment = await db.learnerPreparationEnrollment.findUnique({
    where: {
      userId_trackId: {
        userId: session.user.id,
        trackId,
      },
    },
    select: { id: true },
  });

  if (!enrollment) {
    throw new CertificationServiceError(
      "Join this preparation track before creating a study plan",
      403,
      "TRACK_NOT_JOINED"
    );
  }

  const existing = await db.learnerStudyPlan.findUnique({
    where: {
      userId_trackId: {
        userId: session.user.id,
        trackId,
      },
    },
    include: {
      tasks: { orderBy: [{ dueDate: "asc" }, { position: "asc" }] },
    },
  });

  if (existing) {
    return existing;
  }

  const template = await ensureActiveTemplateForTrack(trackId);
  const { startDate, timezone, weeklyHours } = parsed.data;

  return db.learnerStudyPlan.create({
    data: {
      userId: session.user.id,
      trackId,
      templateId: template.id,
      templateVersion: template.version,
      timezone,
      startDate,
      weeklyHours,
      status: "ACTIVE",
      tasks: {
        create: template.tasks.map((t) => ({
          templateTaskId: t.id,
          objectiveId: t.objectiveId,
          title: t.title,
          description: t.description,
          dueDate: computeTaskDueDate(startDate, t.weekNumber),
          estimatedMinutes: t.estimatedMinutes,
          position: t.position,
          status: "PENDING",
        })),
      },
    },
    include: {
      tasks: { orderBy: [{ dueDate: "asc" }, { position: "asc" }] },
    },
  });
}

export async function rescheduleLearnerStudyPlan(trackId: string, rawInput: unknown) {
  const session = await requireRole(["STUDENT", "ADMIN"]);
  const parsed = rescheduleStudyPlanSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new CertificationServiceError(
      parsed.error.issues[0]?.message ?? "Invalid reschedule input",
      400,
      "VALIDATION_ERROR"
    );
  }

  const db = getDb();
  const plan = await db.learnerStudyPlan.findUnique({
    where: {
      userId_trackId: {
        userId: session.user.id,
        trackId,
      },
    },
    include: {
      template: {
        include: { tasks: true },
      },
      tasks: true,
    },
  });

  if (!plan) {
    throw new CertificationServiceError("Study plan not found", 404, "NOT_FOUND");
  }

  const weekByTemplateTaskId = new Map(
    plan.template.tasks.map((t) => [t.id, t.weekNumber])
  );

  const { newStartDate, timezone } = parsed.data;

  return db.$transaction(async (tx) => {
    await tx.learnerStudyPlan.update({
      where: { id: plan.id },
      data: {
        startDate: newStartDate,
        ...(timezone ? { timezone } : {}),
      },
    });

    // Preserve COMPLETED tasks; only reschedule PENDING tasks
    for (const task of plan.tasks) {
      if (task.status === "COMPLETED") continue;
      const weekNumber = task.templateTaskId
        ? (weekByTemplateTaskId.get(task.templateTaskId) ?? 1)
        : 1;
      await tx.studyTask.update({
        where: { id: task.id },
        data: {
          dueDate: computeTaskDueDate(newStartDate, weekNumber),
        },
      });
    }

    return tx.learnerStudyPlan.findUnique({
      where: { id: plan.id },
      include: { tasks: { orderBy: [{ dueDate: "asc" }, { position: "asc" }] } },
    });
  });
}

export async function toggleStudyTaskCompletion(
  trackId: string,
  taskId: string,
  rawInput: unknown
) {
  const session = await requireRole(["STUDENT", "ADMIN"]);
  const parsed = toggleStudyTaskSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new CertificationServiceError(
      parsed.error.issues[0]?.message ?? "Invalid task update",
      400,
      "VALIDATION_ERROR"
    );
  }

  const db = getDb();
  const task = await db.studyTask.findUnique({
    where: { id: taskId },
    include: {
      studyPlan: {
        select: { id: true, userId: true, trackId: true },
      },
    },
  });

  if (!task || task.studyPlan.trackId !== trackId) {
    throw new CertificationServiceError("Study task not found", 404, "NOT_FOUND");
  }

  if (task.studyPlan.userId !== session.user.id) {
    throw new CertificationServiceError("Forbidden", 403, "FORBIDDEN");
  }

  const nextStatus = parsed.data.completed ? "COMPLETED" : "PENDING";
  const nextCompletedAt = parsed.data.completed ? (task.completedAt ?? new Date()) : null;

  return db.$transaction(async (tx) => {
    const updatedTask = await tx.studyTask.update({
      where: { id: taskId },
      data: {
        status: nextStatus,
        completedAt: nextCompletedAt,
      },
    });

    const pendingCount = await tx.studyTask.count({
      where: {
        studyPlanId: task.studyPlan.id,
        status: "PENDING",
      },
    });

    await tx.learnerStudyPlan.update({
      where: { id: task.studyPlan.id },
      data: {
        status: pendingCount === 0 ? "COMPLETED" : "ACTIVE",
      },
    });

    return updatedTask;
  });
}
