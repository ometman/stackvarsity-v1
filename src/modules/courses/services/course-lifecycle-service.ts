import "server-only";
import { revalidatePath } from "next/cache";
import type { CourseStatus } from "@/generated/prisma/enums";
import { recordAuditEvent } from "@/modules/auth/audit";
import type { ValidDatabaseSession } from "@/modules/auth/session-repository";
import { transitionCourseStatusSchema } from "@/modules/courses/schemas/course-schemas";
import {
  CourseServiceError,
  requireCourseEditorAccess,
} from "@/modules/courses/services/course-authoring-service";
import { getDb } from "@/server/db";

const ALLOWED_TRANSITIONS: Record<CourseStatus, readonly CourseStatus[]> = {
  DRAFT: ["IN_REVIEW", "PUBLISHED", "ARCHIVED"],
  IN_REVIEW: ["DRAFT", "APPROVED", "PUBLISHED", "ARCHIVED"],
  APPROVED: ["DRAFT", "PUBLISHED", "ARCHIVED"],
  PUBLISHED: ["DRAFT", "ARCHIVED"],
  ARCHIVED: ["DRAFT"],
};

export interface CourseCompletenessResult {
  eligible: boolean;
  reasons: string[];
}

export function evaluateCoursePublishReadiness(course: {
  title: string;
  summary: string;
  overview: string;
  category: string;
  level: string;
  modules: Array<{
    archivedAt: Date | null;
    lessons: Array<{ archivedAt: Date | null; isPublished: boolean; content: string }>;
  }>;
}): CourseCompletenessResult {
  const reasons: string[] = [];

  if (!course.title.trim()) reasons.push("Course title is required.");
  if (course.summary.trim().length < 10)
    reasons.push("Course summary must be at least 10 characters.");
  if (course.overview.trim().length < 10)
    reasons.push("Course overview must be at least 10 characters.");
  if (!course.category.trim()) reasons.push("Course category is required.");
  if (!course.level.trim()) reasons.push("Course level is required.");

  const activeModules = course.modules.filter((m) => m.archivedAt === null);
  if (activeModules.length === 0) {
    reasons.push("At least one active module is required.");
  }

  const publishedLessons = activeModules.flatMap((m) =>
    m.lessons.filter((l) => l.archivedAt === null && l.isPublished && l.content.trim().length > 0)
  );
  if (publishedLessons.length === 0) {
    reasons.push("At least one published lesson with content is required.");
  }

  return {
    eligible: reasons.length === 0,
    reasons,
  };
}

export async function transitionCourseStatus(
  session: ValidDatabaseSession,
  courseId: string,
  rawInput: unknown
) {
  await requireCourseEditorAccess(courseId, session);

  const parsed = transitionCourseStatusSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new CourseServiceError(
      parsed.error.issues[0]?.message ?? "Invalid target status",
      400,
      "VALIDATION_ERROR"
    );
  }

  const targetStatus = parsed.data.targetStatus as CourseStatus;
  const db = getDb();

  const course = await db.course.findUnique({
    where: { id: courseId },
    include: {
      modules: {
        where: { archivedAt: null },
        include: {
          lessons: {
            where: { archivedAt: null },
            select: { archivedAt: true, isPublished: true, content: true },
          },
        },
      },
    },
  });

  if (!course) {
    throw new CourseServiceError("Course not found", 404, "COURSE_NOT_FOUND");
  }

  if (course.status === targetStatus) {
    throw new CourseServiceError(
      `Course is already in ${targetStatus} status`,
      400,
      "INVALID_TRANSITION"
    );
  }

  const allowedTargets = ALLOWED_TRANSITIONS[course.status];
  if (!allowedTargets.includes(targetStatus)) {
    throw new CourseServiceError(
      `Cannot transition course from ${course.status} to ${targetStatus}`,
      400,
      "INVALID_TRANSITION"
    );
  }

  if (targetStatus === "APPROVED" || targetStatus === "PUBLISHED") {
    const readiness = evaluateCoursePublishReadiness(course);
    if (!readiness.eligible) {
      throw new CourseServiceError(
        `Course is not ready for ${targetStatus}: ${readiness.reasons.join(" ")}`,
        400,
        "COURSE_INCOMPLETE"
      );
    }
  }

  const updated = await db.course.update({
    where: { id: course.id },
    data: {
      status: targetStatus,
      publishedAt:
        targetStatus === "PUBLISHED" ? (course.publishedAt ?? new Date()) : course.publishedAt,
      archivedAt: targetStatus === "ARCHIVED" ? new Date() : null,
    },
  });

  await recordAuditEvent({
    actorId: session.user.id,
    eventType: "COURSE_STATUS_CHANGED",
    outcome: "SUCCESS",
    metadata: {
      courseId: course.id,
      fromStatus: course.status,
      toStatus: targetStatus,
    },
  });

  try {
    revalidatePath("/courses");
    revalidatePath(`/courses/${updated.slug}`);
    revalidatePath("/sitemap.xml");
  } catch {
    // Revalidation is a no-op outside Next.js request context (e.g. unit tests)
  }

  return updated;
}
