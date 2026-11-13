import "server-only";
import type { UserRole } from "@/generated/prisma/enums";
import { requireCourseEntitlement } from "@/modules/enrollments/services/enrollment-service";
import { getDb } from "@/server/db";

export class LearningServiceError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly code: string
  ) {
    super(message);
    this.name = "LearningServiceError";
  }
}

export async function getCourseEntryTarget(userId: string, userRole: UserRole, courseSlug: string) {
  const entitlement = await requireCourseEntitlement(userId, userRole, courseSlug, "slug");
  const db = getDb();

  const modules = await db.courseModule.findMany({
    where: { courseId: entitlement.course.id, archivedAt: null },
    orderBy: { position: "asc" },
    include: {
      lessons: {
        where:
          entitlement.mode === "STAFF_PREVIEW"
            ? { archivedAt: null }
            : { archivedAt: null, isPublished: true },
        orderBy: { position: "asc" },
        select: { id: true, slug: true },
      },
    },
  });

  const orderedLessons = modules.flatMap((m) => m.lessons);
  if (orderedLessons.length === 0) {
    return {
      courseId: entitlement.course.id,
      courseSlug: entitlement.course.slug,
      targetLessonSlug: null,
      mode: entitlement.mode,
    };
  }

  const courseProgress = await db.courseProgress.findUnique({
    where: { userId_courseId: { userId, courseId: entitlement.course.id } },
    select: { lastLessonId: true },
  });

  const resumeLesson = courseProgress?.lastLessonId
    ? orderedLessons.find((l) => l.id === courseProgress.lastLessonId)
    : undefined;

  return {
    courseId: entitlement.course.id,
    courseSlug: entitlement.course.slug,
    targetLessonSlug: (resumeLesson ?? orderedLessons[0]).slug,
    mode: entitlement.mode,
  };
}

export async function getProtectedLessonView(
  userId: string,
  userRole: UserRole,
  courseSlug: string,
  lessonSlug: string
) {
  const entitlement = await requireCourseEntitlement(userId, userRole, courseSlug, "slug");
  const db = getDb();

  const modules = await db.courseModule.findMany({
    where: { courseId: entitlement.course.id, archivedAt: null },
    orderBy: { position: "asc" },
    include: {
      lessons: {
        where:
          entitlement.mode === "STAFF_PREVIEW"
            ? { archivedAt: null }
            : { archivedAt: null, isPublished: true },
        orderBy: { position: "asc" },
        include: {
          resources: {
            orderBy: { position: "asc" },
          },
        },
      },
    },
  });

  const flatLessons = modules.flatMap((mod) =>
    mod.lessons.map((lesson) => ({
      ...lesson,
      moduleId: mod.id,
      moduleTitle: mod.title,
    }))
  );

  const currentIndex = flatLessons.findIndex((l) => l.slug === lessonSlug);
  if (currentIndex === -1) {
    throw new LearningServiceError("Lesson not found", 404, "LESSON_NOT_FOUND");
  }

  const currentLesson = flatLessons[currentIndex];
  const previousLesson = currentIndex > 0 ? flatLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < flatLessons.length - 1 ? flatLessons[currentIndex + 1] : null;

  const [lessonProgressRows, courseProgress] = await Promise.all([
    db.lessonProgress.findMany({
      where: { userId, courseId: entitlement.course.id, completed: true },
      select: { lessonId: true },
    }),
    db.courseProgress.findUnique({
      where: { userId_courseId: { userId, courseId: entitlement.course.id } },
      select: { progressPercent: true, completedLessons: true, totalLessons: true },
    }),
  ]);

  if (entitlement.mode === "ENROLLED") {
    const now = new Date();
    await db.$transaction([
      db.lessonProgress.upsert({
        where: { userId_lessonId: { userId, lessonId: currentLesson.id } },
        update: { lastViewedAt: now },
        create: {
          userId,
          lessonId: currentLesson.id,
          courseId: entitlement.course.id,
          completed: false,
          lastViewedAt: now,
        },
      }),
      db.courseProgress.upsert({
        where: { userId_courseId: { userId, courseId: entitlement.course.id } },
        update: { lastLessonId: currentLesson.id, totalLessons: flatLessons.length },
        create: {
          userId,
          courseId: entitlement.course.id,
          lastLessonId: currentLesson.id,
          completedLessons: lessonProgressRows.length,
          totalLessons: flatLessons.length,
          progressPercent:
            flatLessons.length > 0
              ? Math.round((lessonProgressRows.length / flatLessons.length) * 100)
              : 0,
        },
      }),
    ]);
  }

  const completedLessonIds = lessonProgressRows.map((r) => r.lessonId);

  return {
    mode: entitlement.mode,
    course: {
      id: entitlement.course.id,
      slug: entitlement.course.slug,
      title: entitlement.course.title,
      status: entitlement.course.status,
    },
    modules: modules.map((m) => ({
      id: m.id,
      title: m.title,
      lessons: m.lessons.map((l) => ({
        id: l.id,
        slug: l.slug,
        title: l.title,
        type: l.type,
        estimatedMinutes: l.estimatedMinutes,
      })),
    })),
    currentLesson: {
      id: currentLesson.id,
      slug: currentLesson.slug,
      title: currentLesson.title,
      type: currentLesson.type,
      content: currentLesson.content,
      videoUrl: currentLesson.videoUrl,
      estimatedMinutes: currentLesson.estimatedMinutes,
      moduleTitle: currentLesson.moduleTitle,
      resources: currentLesson.resources.map((r) => ({
        id: r.id,
        title: r.title,
        url: r.url,
        resourceType: r.resourceType,
      })),
    },
    previousLesson: previousLesson
      ? { slug: previousLesson.slug, title: previousLesson.title }
      : null,
    nextLesson: nextLesson ? { slug: nextLesson.slug, title: nextLesson.title } : null,
    completedLessonIds,
    progressPercent: courseProgress?.progressPercent ?? 0,
    isCurrentLessonCompleted: completedLessonIds.includes(currentLesson.id),
  };
}
