import "server-only";
import { AuthModuleError, ForbiddenError } from "@/modules/auth/errors";
import { setLessonCompletionSchema } from "@/modules/learning/schemas/progress-schemas";
import { LearningServiceError } from "@/modules/learning/services/lesson-player-service";
import { getDb } from "@/server/db";

export function calculateProgressPercent(completedLessons: number, totalLessons: number): number {
  if (totalLessons <= 0) {
    return 0;
  }
  return Math.min(100, Math.max(0, Math.round((completedLessons / totalLessons) * 100)));
}

export async function setLessonCompletion(userId: string, rawInput: unknown) {
  const parsed = setLessonCompletionSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new LearningServiceError(
      parsed.error.issues[0]?.message ?? "Invalid progress payload",
      400,
      "VALIDATION_ERROR"
    );
  }

  const { lessonId, completed } = parsed.data;
  const db = getDb();

  const lesson = await db.lesson.findUnique({
    where: { id: lessonId },
    include: {
      module: {
        include: {
          course: {
            select: { id: true, status: true, archivedAt: true },
          },
        },
      },
    },
  });

  if (
    !lesson ||
    lesson.archivedAt !== null ||
    !lesson.isPublished ||
    lesson.module.archivedAt !== null ||
    lesson.module.course.archivedAt !== null ||
    lesson.module.course.status !== "PUBLISHED"
  ) {
    throw new LearningServiceError("Lesson not found or not published", 404, "LESSON_NOT_FOUND");
  }

  const courseId = lesson.module.course.id;

  const enrollment = await db.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId } },
    select: { id: true, status: true },
  });

  if (!enrollment || (enrollment.status !== "ACTIVE" && enrollment.status !== "COMPLETED")) {
    throw new ForbiddenError("Active enrollment required to update lesson progress");
  }

  const now = new Date();

  const result = await db.$transaction(async (tx) => {
    await tx.lessonProgress.upsert({
      where: { userId_lessonId: { userId, lessonId } },
      update: {
        completed,
        completedAt: completed ? now : null,
        lastViewedAt: now,
      },
      create: {
        userId,
        lessonId,
        courseId,
        completed,
        completedAt: completed ? now : null,
        lastViewedAt: now,
      },
    });

    const eligibleLessons = await tx.lesson.findMany({
      where: {
        archivedAt: null,
        isPublished: true,
        module: {
          courseId,
          archivedAt: null,
        },
      },
      select: { id: true },
    });

    const eligibleIds = eligibleLessons.map((l) => l.id);
    const totalLessons = eligibleIds.length;

    const completedLessons =
      totalLessons > 0
        ? await tx.lessonProgress.count({
            where: {
              userId,
              courseId,
              completed: true,
              lessonId: { in: eligibleIds },
            },
          })
        : 0;

    const progressPercent = calculateProgressPercent(completedLessons, totalLessons);
    const courseCompleted = totalLessons > 0 && completedLessons >= totalLessons;

    await tx.courseProgress.upsert({
      where: { userId_courseId: { userId, courseId } },
      update: {
        completedLessons,
        totalLessons,
        progressPercent,
        lastLessonId: lessonId,
        completedAt: courseCompleted ? now : null,
      },
      create: {
        userId,
        courseId,
        completedLessons,
        totalLessons,
        progressPercent,
        lastLessonId: lessonId,
        completedAt: courseCompleted ? now : null,
      },
    });

    await tx.enrollment.update({
      where: { id: enrollment.id },
      data: {
        status: courseCompleted ? "COMPLETED" : "ACTIVE",
        completedAt: courseCompleted ? now : null,
      },
    });

    return {
      lessonId,
      courseId,
      completed,
      completedLessons,
      totalLessons,
      progressPercent,
      courseCompleted,
    };
  });

  return result;
}

export function mapLearningRouteError(error: unknown) {
  if (error instanceof AuthModuleError) {
    return { status: error.statusCode, body: { error: error.message, code: error.code } };
  }
  if (error instanceof LearningServiceError) {
    return { status: error.statusCode, body: { error: error.message, code: error.code } };
  }
  return { status: 500, body: { error: "Internal server error", code: "INTERNAL_ERROR" } };
}
