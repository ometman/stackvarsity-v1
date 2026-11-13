import "server-only";
import type { UserRole } from "@/generated/prisma/enums";
import { recordAuditEvent } from "@/modules/auth/audit";
import { AuthModuleError, ForbiddenError } from "@/modules/auth/errors";
import type { ValidDatabaseSession } from "@/modules/auth/session-repository";
import {
  adminManageEnrollmentSchema,
  createEnrollmentSchema,
} from "@/modules/enrollments/schemas/enrollment-schemas";
import { getDb } from "@/server/db";

export class EnrollmentServiceError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly code: string
  ) {
    super(message);
    this.name = "EnrollmentServiceError";
  }
}

export async function enrollInFreeCourse(userId: string, rawInput: unknown) {
  const parsed = createEnrollmentSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new EnrollmentServiceError(
      parsed.error.issues[0]?.message ?? "Invalid enrollment request",
      400,
      "VALIDATION_ERROR"
    );
  }

  const { courseId } = parsed.data;
  const db = getDb();

  const course = await db.course.findUnique({
    where: { id: courseId },
    select: {
      id: true,
      slug: true,
      title: true,
      status: true,
      accessType: true,
      archivedAt: true,
      modules: {
        where: { archivedAt: null },
        select: {
          lessons: {
            where: { archivedAt: null, isPublished: true },
            select: { id: true },
          },
        },
      },
    },
  });

  if (!course || course.archivedAt !== null || course.status !== "PUBLISHED") {
    throw new EnrollmentServiceError(
      "This course is not available for enrollment",
      404,
      "COURSE_UNAVAILABLE"
    );
  }

  if (course.accessType !== "FREE") {
    throw new EnrollmentServiceError(
      "Paid course enrollment is not enabled yet",
      403,
      "PAID_COURSE_LOCKED"
    );
  }

  const existing = await db.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId } },
  });

  if (existing) {
    if (existing.status === "REVOKED") {
      throw new EnrollmentServiceError(
        "Your enrollment for this course has been revoked",
        403,
        "ENROLLMENT_REVOKED"
      );
    }
    return { enrollment: existing, created: false, courseSlug: course.slug };
  }

  const totalLessons = course.modules.reduce((sum, mod) => sum + mod.lessons.length, 0);

  const enrollment = await db.$transaction(async (tx) => {
    const created = await tx.enrollment.create({
      data: {
        userId,
        courseId,
        status: "ACTIVE",
        source: "FREE",
      },
    });

    await tx.courseProgress.upsert({
      where: { userId_courseId: { userId, courseId } },
      update: { totalLessons },
      create: {
        userId,
        courseId,
        completedLessons: 0,
        totalLessons,
        progressPercent: 0,
      },
    });

    return created;
  });

  await recordAuditEvent({
    actorId: userId,
    eventType: "COURSE_ENROLLED",
    outcome: "SUCCESS",
    metadata: { courseId, source: "FREE" },
  });

  return { enrollment, created: true, courseSlug: course.slug };
}

export async function getUserEnrollmentForCourse(userId: string, courseId: string) {
  const db = getDb();
  return db.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId } },
  });
}

export async function requireCourseEntitlement(
  userId: string,
  userRole: UserRole,
  courseIdentifier: string,
  by: "id" | "slug" = "slug"
) {
  const db = getDb();
  const course = await db.course.findFirst({
    where: by === "slug" ? { slug: courseIdentifier } : { id: courseIdentifier },
    include: {
      assignments: {
        where: { userId },
        select: { id: true },
      },
      enrollments: {
        where: { userId },
        select: { id: true, status: true, source: true },
      },
    },
  });

  if (!course || course.archivedAt !== null) {
    throw new EnrollmentServiceError("Course not found", 404, "COURSE_NOT_FOUND");
  }

  const isStaffPreview =
    userRole === "ADMIN" || (userRole === "INSTRUCTOR" && course.assignments.length > 0);

  const activeEnrollment = course.enrollments.find(
    (e) => e.status === "ACTIVE" || e.status === "COMPLETED"
  );

  if (isStaffPreview && !activeEnrollment) {
    return {
      course,
      mode: "STAFF_PREVIEW" as const,
      enrollment: null,
    };
  }

  if (course.status !== "PUBLISHED" || !activeEnrollment) {
    throw new ForbiddenError("Active enrollment is required to access this course");
  }

  return {
    course,
    mode: "ENROLLED" as const,
    enrollment: activeEnrollment,
  };
}

export async function listUserEnrollments(userId: string) {
  const db = getDb();
  const enrollments = await db.enrollment.findMany({
    where: {
      userId,
      status: { in: ["ACTIVE", "COMPLETED"] },
      course: { archivedAt: null },
    },
    include: {
      course: {
        select: {
          id: true,
          slug: true,
          title: true,
          summary: true,
          category: true,
          level: true,
          status: true,
          modules: {
            where: { archivedAt: null },
            orderBy: { position: "asc" },
            select: {
              lessons: {
                where: { archivedAt: null, isPublished: true },
                orderBy: { position: "asc" },
                select: { id: true, slug: true, title: true },
              },
            },
          },
        },
      },
    },
    orderBy: { enrolledAt: "desc" },
  });

  const progressRows = await db.courseProgress.findMany({
    where: { userId },
    include: {
      lastLesson: {
        select: { id: true, slug: true, title: true },
      },
    },
  });

  const progressByCourse = new Map(progressRows.map((p) => [p.courseId, p]));

  return enrollments.map((enrollment) => {
    const progress = progressByCourse.get(enrollment.courseId);
    const orderedLessons = enrollment.course.modules.flatMap((m) => m.lessons);
    const firstLesson = orderedLessons[0] ?? null;
    const resumeLesson =
      progress?.lastLesson && orderedLessons.some((l) => l.id === progress.lastLesson?.id)
        ? progress.lastLesson
        : firstLesson;

    return {
      id: enrollment.id,
      courseId: enrollment.courseId,
      status: enrollment.status,
      source: enrollment.source,
      enrolledAt: enrollment.enrolledAt,
      completedAt: enrollment.completedAt,
      course: {
        id: enrollment.course.id,
        slug: enrollment.course.slug,
        title: enrollment.course.title,
        summary: enrollment.course.summary,
        category: enrollment.course.category,
        level: enrollment.course.level,
        totalLessons: orderedLessons.length,
      },
      progress: {
        completedLessons: progress?.completedLessons ?? 0,
        totalLessons: progress?.totalLessons ?? orderedLessons.length,
        progressPercent: progress?.progressPercent ?? 0,
      },
      resumeLessonSlug: resumeLesson?.slug ?? null,
      resumeLessonTitle: resumeLesson?.title ?? null,
    };
  });
}

export async function adminManageEnrollment(adminSession: ValidDatabaseSession, rawInput: unknown) {
  if (adminSession.user.role !== "ADMIN") {
    throw new ForbiddenError("Only administrators may manage enrollments");
  }

  const parsed = adminManageEnrollmentSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new EnrollmentServiceError(
      parsed.error.issues[0]?.message ?? "Invalid enrollment operation",
      400,
      "VALIDATION_ERROR"
    );
  }

  const { userId, courseId, action } = parsed.data;
  const db = getDb();

  const [targetUser, course] = await Promise.all([
    db.user.findUnique({ where: { id: userId }, select: { id: true, status: true } }),
    db.course.findUnique({ where: { id: courseId }, select: { id: true } }),
  ]);

  if (!targetUser) {
    throw new EnrollmentServiceError("Target user not found", 404, "USER_NOT_FOUND");
  }
  if (!course) {
    throw new EnrollmentServiceError("Course not found", 404, "COURSE_NOT_FOUND");
  }

  const enrollment =
    action === "GRANT"
      ? await db.enrollment.upsert({
          where: { userId_courseId: { userId, courseId } },
          update: {
            status: "ACTIVE",
            source: "ADMIN_GRANTED",
            grantedById: adminSession.user.id,
            revokedAt: null,
          },
          create: {
            userId,
            courseId,
            status: "ACTIVE",
            source: "ADMIN_GRANTED",
            grantedById: adminSession.user.id,
          },
        })
      : await db.enrollment.update({
          where: { userId_courseId: { userId, courseId } },
          data: {
            status: "REVOKED",
            revokedAt: new Date(),
          },
        });

  await recordAuditEvent({
    actorId: adminSession.user.id,
    targetUserId: userId,
    eventType: action === "GRANT" ? "ENROLLMENT_ADMIN_GRANTED" : "ENROLLMENT_REVOKED",
    outcome: "SUCCESS",
    metadata: { courseId },
  });

  return enrollment;
}

export function mapEnrollmentRouteError(error: unknown) {
  if (error instanceof AuthModuleError) {
    return { status: error.statusCode, body: { error: error.message, code: error.code } };
  }
  if (error instanceof EnrollmentServiceError) {
    return { status: error.statusCode, body: { error: error.message, code: error.code } };
  }
  return { status: 500, body: { error: "Internal server error", code: "INTERNAL_ERROR" } };
}
