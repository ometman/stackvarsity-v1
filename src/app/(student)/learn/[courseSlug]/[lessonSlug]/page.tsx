import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { buttonVariants } from "@/components/ui/button";
import { ForbiddenError } from "@/modules/auth/errors";
import { requirePageRole } from "@/modules/auth/route-guards";
import { EnrollmentServiceError } from "@/modules/enrollments/services/enrollment-service";
import { LessonCompletionButton } from "@/modules/learning/components/lesson-completion-button";
import { LessonPlayerShell } from "@/modules/learning/components/lesson-player-shell";
import {
  getProtectedLessonView,
  LearningServiceError,
} from "@/modules/learning/services/lesson-player-service";

export const metadata: Metadata = {
  title: "Lesson Player",
  robots: { index: false, follow: false },
};

interface LessonPageProps {
  params: Promise<{ courseSlug: string; lessonSlug: string }>;
}

async function LessonPlayerContent({ params }: LessonPageProps) {
  const { courseSlug, lessonSlug } = await params;
  const session = await requirePageRole(
    ["STUDENT", "INSTRUCTOR", "ADMIN"],
    `/learn/${courseSlug}/${lessonSlug}`
  );

  let data;
  try {
    data = await getProtectedLessonView(session.user.id, session.user.role, courseSlug, lessonSlug);
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return (
        <div role="alert" className="mx-auto my-12 max-w-lg rounded-lg border p-6 text-center">
          <h1 className="text-lg font-semibold">Access Denied</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Active enrollment is required to view this lesson.
          </p>
          <Link
            href={`/courses/${courseSlug}`}
            className={buttonVariants({ className: "mt-4", size: "sm" })}
          >
            Enroll on Course Page
          </Link>
        </div>
      );
    }
    if (
      (error instanceof EnrollmentServiceError || error instanceof LearningServiceError) &&
      error.statusCode === 404
    ) {
      notFound();
    }
    throw error;
  }

  return (
    <LessonPlayerShell
      mode={data.mode}
      course={data.course}
      modules={data.modules}
      currentLesson={data.currentLesson}
      previousLesson={data.previousLesson}
      nextLesson={data.nextLesson}
      completedLessonIds={data.completedLessonIds}
      progressPercent={data.progressPercent}
      completionAction={
        data.mode === "ENROLLED" ? (
          <LessonCompletionButton
            lessonId={data.currentLesson.id}
            initialCompleted={data.isCurrentLessonCompleted}
          />
        ) : null
      }
    />
  );
}

export default function LearnLessonPage({ params }: LessonPageProps) {
  return (
    <main className="flex-1">
      <Suspense
        fallback={<div className="p-8 text-sm text-muted-foreground">Loading lesson...</div>}
      >
        <LessonPlayerContent params={params} />
      </Suspense>
    </main>
  );
}
