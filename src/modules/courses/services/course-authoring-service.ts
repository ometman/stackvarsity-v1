import "server-only";
import { recordAuditEvent } from "@/modules/auth/audit";
import { AuthModuleError, ForbiddenError } from "@/modules/auth/errors";
import type { ValidDatabaseSession } from "@/modules/auth/session-repository";
import {
  assignInstructorSchema,
  createCourseSchema,
  createLessonSchema,
  createModuleSchema,
  slugifyTitle,
  updateCourseSchema,
  updateLessonSchema,
  updateModuleSchema,
} from "@/modules/courses/schemas/course-schemas";
import { getDb } from "@/server/db";

export class CourseServiceError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly code: string
  ) {
    super(message);
    this.name = "CourseServiceError";
  }
}

export async function requireCourseEditorAccess(
  courseId: string,
  session: ValidDatabaseSession
): Promise<void> {
  const db = getDb();
  const course = await db.course.findUnique({
    where: { id: courseId },
    select: {
      id: true,
      assignments: {
        where: { userId: session.user.id },
        select: { id: true },
      },
    },
  });

  if (!course) {
    throw new CourseServiceError("Course not found", 404, "COURSE_NOT_FOUND");
  }

  if (session.user.role === "ADMIN") {
    return;
  }

  if (session.user.role !== "INSTRUCTOR" || course.assignments.length === 0) {
    await recordAuditEvent({
      actorId: session.user.id,
      eventType: "COURSE_ACCESS_DENIED",
      outcome: "DENIED",
      metadata: { courseId, role: session.user.role },
    });
    throw new ForbiddenError("You are not assigned to manage this course");
  }
}

export async function listAssignedCourses(session: ValidDatabaseSession) {
  const db = getDb();
  const where =
    session.user.role === "ADMIN"
      ? {}
      : {
          assignments: {
            some: { userId: session.user.id },
          },
        };

  return db.course.findMany({
    where,
    include: {
      modules: {
        where: { archivedAt: null },
        select: {
          id: true,
          _count: {
            select: { lessons: { where: { archivedAt: null } } },
          },
        },
      },
      _count: {
        select: {
          enrollments: { where: { status: { in: ["ACTIVE", "COMPLETED"] } } },
        },
      },
    },
    orderBy: [{ updatedAt: "desc" }],
  });
}

async function resolveUniqueCourseSlug(desiredSlug: string): Promise<string> {
  const db = getDb();
  const existing = await db.course.findUnique({
    where: { slug: desiredSlug },
    select: { id: true },
  });
  if (!existing) {
    return desiredSlug;
  }
  const suffix = Math.random().toString(36).slice(2, 7);
  return `${desiredSlug.slice(0, 90)}-${suffix}`;
}

export async function createDraftCourse(session: ValidDatabaseSession, rawInput: unknown) {
  const parsed = createCourseSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new CourseServiceError(
      parsed.error.issues[0]?.message ?? "Invalid course data",
      400,
      "VALIDATION_ERROR"
    );
  }

  const data = parsed.data;
  const baseSlug = data.slug ?? slugifyTitle(data.title);
  const slug = await resolveUniqueCourseSlug(baseSlug);
  const db = getDb();

  const created = await db.$transaction(async (tx) => {
    const course = await tx.course.create({
      data: {
        slug,
        title: data.title,
        summary: data.summary,
        overview: data.overview,
        category: data.category,
        level: data.level,
        modality: data.modality,
        accessType: data.accessType,
        intendedAudience: data.intendedAudience,
        prerequisites: data.prerequisites,
        learningOutcomes: data.learningOutcomes,
        relatedCertificationSlug: data.relatedCertificationSlug ?? null,
        status: "DRAFT",
        createdById: session.user.id,
      },
    });

    await tx.instructorAssignment.create({
      data: {
        courseId: course.id,
        userId: session.user.id,
        assignedById: session.user.id,
      },
    });

    return course;
  });

  await recordAuditEvent({
    actorId: session.user.id,
    eventType: "COURSE_CREATED",
    outcome: "SUCCESS",
    metadata: { courseId: created.id, slug: created.slug },
  });

  return created;
}

export async function getCourseForEditor(session: ValidDatabaseSession, courseId: string) {
  await requireCourseEditorAccess(courseId, session);
  const db = getDb();

  const course = await db.course.findUnique({
    where: { id: courseId },
    include: {
      assignments: {
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
      },
      modules: {
        where: { archivedAt: null },
        orderBy: { position: "asc" },
        include: {
          lessons: {
            where: { archivedAt: null },
            orderBy: { position: "asc" },
            include: {
              resources: {
                orderBy: { position: "asc" },
              },
            },
          },
        },
      },
      _count: {
        select: {
          enrollments: { where: { status: { in: ["ACTIVE", "COMPLETED"] } } },
        },
      },
    },
  });

  if (!course) {
    throw new CourseServiceError("Course not found", 404, "COURSE_NOT_FOUND");
  }

  return course;
}

export async function updateCourseMetadata(
  session: ValidDatabaseSession,
  courseId: string,
  rawInput: unknown
) {
  await requireCourseEditorAccess(courseId, session);
  const parsed = updateCourseSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new CourseServiceError(
      parsed.error.issues[0]?.message ?? "Invalid course update payload",
      400,
      "VALIDATION_ERROR"
    );
  }

  const db = getDb();
  const data = parsed.data;
  const updated = await db.course.update({
    where: { id: courseId },
    data: {
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.summary !== undefined ? { summary: data.summary } : {}),
      ...(data.overview !== undefined ? { overview: data.overview } : {}),
      ...(data.category !== undefined ? { category: data.category } : {}),
      ...(data.level !== undefined ? { level: data.level } : {}),
      ...(data.modality !== undefined ? { modality: data.modality } : {}),
      ...(data.accessType !== undefined ? { accessType: data.accessType } : {}),
      ...(data.intendedAudience !== undefined ? { intendedAudience: data.intendedAudience } : {}),
      ...(data.prerequisites !== undefined ? { prerequisites: data.prerequisites } : {}),
      ...(data.learningOutcomes !== undefined ? { learningOutcomes: data.learningOutcomes } : {}),
      ...(data.relatedCertificationSlug !== undefined
        ? { relatedCertificationSlug: data.relatedCertificationSlug }
        : {}),
    },
  });

  await recordAuditEvent({
    actorId: session.user.id,
    eventType: "COURSE_UPDATED",
    outcome: "SUCCESS",
    metadata: { courseId },
  });

  return updated;
}

export async function createCourseModule(
  session: ValidDatabaseSession,
  courseId: string,
  rawInput: unknown
) {
  await requireCourseEditorAccess(courseId, session);
  const parsed = createModuleSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new CourseServiceError(
      parsed.error.issues[0]?.message ?? "Invalid module data",
      400,
      "VALIDATION_ERROR"
    );
  }

  const db = getDb();
  const created = await db.$transaction(async (tx) => {
    const maxPos = await tx.courseModule.aggregate({
      where: { courseId, archivedAt: null },
      _max: { position: true },
    });
    const position = parsed.data.position ?? (maxPos._max.position ?? 0) + 1;

    return tx.courseModule.create({
      data: {
        courseId,
        title: parsed.data.title,
        description: parsed.data.description ?? null,
        position,
      },
    });
  });

  return created;
}

export async function updateCourseModule(
  session: ValidDatabaseSession,
  courseId: string,
  rawInput: unknown
) {
  await requireCourseEditorAccess(courseId, session);
  const parsed = updateModuleSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new CourseServiceError(
      parsed.error.issues[0]?.message ?? "Invalid module update",
      400,
      "VALIDATION_ERROR"
    );
  }

  const db = getDb();
  const existing = await db.courseModule.findFirst({
    where: { id: parsed.data.moduleId, courseId },
  });
  if (!existing) {
    throw new CourseServiceError("Module not found in course", 404, "MODULE_NOT_FOUND");
  }

  return db.courseModule.update({
    where: { id: existing.id },
    data: {
      ...(parsed.data.title !== undefined ? { title: parsed.data.title } : {}),
      ...(parsed.data.description !== undefined ? { description: parsed.data.description } : {}),
      ...(parsed.data.position !== undefined ? { position: parsed.data.position } : {}),
      ...(parsed.data.archived !== undefined
        ? { archivedAt: parsed.data.archived ? new Date() : null }
        : {}),
    },
  });
}

async function resolveUniqueLessonSlug(moduleId: string, desiredSlug: string): Promise<string> {
  const db = getDb();
  const existing = await db.lesson.findUnique({
    where: { moduleId_slug: { moduleId, slug: desiredSlug } },
    select: { id: true },
  });
  if (!existing) {
    return desiredSlug;
  }
  const suffix = Math.random().toString(36).slice(2, 7);
  return `${desiredSlug.slice(0, 90)}-${suffix}`;
}

export async function createModuleLesson(
  session: ValidDatabaseSession,
  moduleId: string,
  rawInput: unknown
) {
  const db = getDb();
  const mod = await db.courseModule.findUnique({
    where: { id: moduleId },
    select: { id: true, courseId: true, archivedAt: true },
  });
  if (!mod || mod.archivedAt !== null) {
    throw new CourseServiceError("Module not found", 404, "MODULE_NOT_FOUND");
  }

  await requireCourseEditorAccess(mod.courseId, session);

  const parsed = createLessonSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new CourseServiceError(
      parsed.error.issues[0]?.message ?? "Invalid lesson data",
      400,
      "VALIDATION_ERROR"
    );
  }

  const data = parsed.data;
  const slug = await resolveUniqueLessonSlug(moduleId, data.slug ?? slugifyTitle(data.title));

  return db.$transaction(async (tx) => {
    const maxPos = await tx.lesson.aggregate({
      where: { moduleId, archivedAt: null },
      _max: { position: true },
    });
    const position = data.position ?? (maxPos._max.position ?? 0) + 1;

    const lesson = await tx.lesson.create({
      data: {
        moduleId,
        slug,
        title: data.title,
        type: data.type,
        content: data.content,
        videoUrl: data.videoUrl ?? null,
        estimatedMinutes: data.estimatedMinutes ?? null,
        position,
        isPublished: data.isPublished,
      },
    });

    if (data.resources && data.resources.length > 0) {
      await tx.lessonResource.createMany({
        data: data.resources.map((res, index) => ({
          lessonId: lesson.id,
          title: res.title,
          url: res.url,
          resourceType: res.resourceType,
          position: index + 1,
        })),
      });
    }

    return tx.lesson.findUnique({
      where: { id: lesson.id },
      include: { resources: { orderBy: { position: "asc" } } },
    });
  });
}

export async function updateModuleLesson(
  session: ValidDatabaseSession,
  moduleId: string,
  rawInput: unknown
) {
  const db = getDb();
  const mod = await db.courseModule.findUnique({
    where: { id: moduleId },
    select: { id: true, courseId: true },
  });
  if (!mod) {
    throw new CourseServiceError("Module not found", 404, "MODULE_NOT_FOUND");
  }

  await requireCourseEditorAccess(mod.courseId, session);

  const parsed = updateLessonSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new CourseServiceError(
      parsed.error.issues[0]?.message ?? "Invalid lesson update",
      400,
      "VALIDATION_ERROR"
    );
  }

  const data = parsed.data;
  const existing = await db.lesson.findFirst({
    where: { id: data.lessonId, moduleId },
  });
  if (!existing) {
    throw new CourseServiceError("Lesson not found in module", 404, "LESSON_NOT_FOUND");
  }

  return db.$transaction(async (tx) => {
    await tx.lesson.update({
      where: { id: existing.id },
      data: {
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.type !== undefined ? { type: data.type } : {}),
        ...(data.content !== undefined ? { content: data.content } : {}),
        ...(data.videoUrl !== undefined ? { videoUrl: data.videoUrl } : {}),
        ...(data.estimatedMinutes !== undefined ? { estimatedMinutes: data.estimatedMinutes } : {}),
        ...(data.position !== undefined ? { position: data.position } : {}),
        ...(data.isPublished !== undefined ? { isPublished: data.isPublished } : {}),
        ...(data.archived !== undefined ? { archivedAt: data.archived ? new Date() : null } : {}),
      },
    });

    if (data.resources !== undefined) {
      await tx.lessonResource.deleteMany({ where: { lessonId: existing.id } });
      if (data.resources.length > 0) {
        await tx.lessonResource.createMany({
          data: data.resources.map((res, index) => ({
            lessonId: existing.id,
            title: res.title,
            url: res.url,
            resourceType: res.resourceType,
            position: index + 1,
          })),
        });
      }
    }

    return tx.lesson.findUnique({
      where: { id: existing.id },
      include: { resources: { orderBy: { position: "asc" } } },
    });
  });
}

export async function assignInstructorToCourse(
  adminSession: ValidDatabaseSession,
  courseId: string,
  rawInput: unknown
) {
  if (adminSession.user.role !== "ADMIN") {
    throw new ForbiddenError("Only administrators may assign course instructors");
  }
  const parsed = assignInstructorSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new CourseServiceError(
      parsed.error.issues[0]?.message ?? "Invalid instructor assignment",
      400,
      "VALIDATION_ERROR"
    );
  }

  const db = getDb();
  const [course, targetUser] = await Promise.all([
    db.course.findUnique({ where: { id: courseId }, select: { id: true } }),
    db.user.findUnique({
      where: { id: parsed.data.userId },
      select: { id: true, role: true, status: true },
    }),
  ]);

  if (!course) {
    throw new CourseServiceError("Course not found", 404, "COURSE_NOT_FOUND");
  }
  if (!targetUser || targetUser.status !== "ACTIVE") {
    throw new CourseServiceError("Target user is not active", 400, "INVALID_INSTRUCTOR");
  }
  if (targetUser.role !== "INSTRUCTOR" && targetUser.role !== "ADMIN") {
    throw new CourseServiceError(
      "Assigned user must hold INSTRUCTOR or ADMIN role",
      400,
      "INVALID_INSTRUCTOR_ROLE"
    );
  }

  const assignment = await db.instructorAssignment.upsert({
    where: { courseId_userId: { courseId, userId: targetUser.id } },
    update: { assignedById: adminSession.user.id },
    create: {
      courseId,
      userId: targetUser.id,
      assignedById: adminSession.user.id,
    },
  });

  await recordAuditEvent({
    actorId: adminSession.user.id,
    targetUserId: targetUser.id,
    eventType: "INSTRUCTOR_ASSIGNED",
    outcome: "SUCCESS",
    metadata: { courseId },
  });

  return assignment;
}

export function mapCourseRouteError(error: unknown) {
  if (error instanceof AuthModuleError) {
    return { status: error.statusCode, body: { error: error.message, code: error.code } };
  }
  if (error instanceof CourseServiceError) {
    return { status: error.statusCode, body: { error: error.message, code: error.code } };
  }
  return { status: 500, body: { error: "Internal server error", code: "INTERNAL_ERROR" } };
}
