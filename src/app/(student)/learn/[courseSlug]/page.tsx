import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { buttonVariants } from "@/components/ui/button";
import { ForbiddenError } from "@/modules/auth/errors";
import { requirePageRole } from "@/modules/auth/route-guards";
import { EnrollmentServiceError } from "@/modules/enrollments/services/enrollment-service";
import { getCourseEntryTarget } from "@/modules/learning/services/lesson-player-service";

export const metadata: Metadata = {
  title: "Course Workspace",
  robots: { index: false, follow: false },
};

interface LearnCourseEntryProps {
  params: Promise<{ courseSlug: string }>;
}

async function LearnCourseEntryContent({ courseSlug }: { courseSlug: string }) {
  const session = await requirePageRole(["STUDENT", "INSTRUCTOR", "ADMIN"], `/learn/${courseSlug}`);

  let target;
  try {
    target = await getCourseEntryTarget(session.user.id, session.user.role, courseSlug);
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return (
        <div role="alert" className="mx-auto max-w-lg rounded-lg border p-6 text-center">
          <h1 className="text-lg font-semibold">Enrollment Required</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            You need an active enrollment to access this course.
          </p>
          <Link
            href={`/courses/${courseSlug}`}
            className={buttonVariants({ className: "mt-4", size: "sm" })}
          >
            View Course Details
          </Link>
        </div>
      );
    }
    if (error instanceof EnrollmentServiceError && error.statusCode === 404) {
      notFound();
    }
    throw error;
  }

  if (!target.targetLessonSlug) {
    return (
      <div className="mx-auto max-w-lg rounded-lg border p-6 text-center">
        <h1 className="text-lg font-semibold">No Lessons Published Yet</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This course does not have any published lessons yet.
        </p>
        <Link href="/student" className={buttonVariants({ className: "mt-4", size: "sm" })}>
          Back to My Learning
        </Link>
      </div>
    );
  }

  redirect(`/learn/${target.courseSlug}/${target.targetLessonSlug}`);
}

export default async function LearnCourseEntryPage({ params }: LearnCourseEntryProps) {
  const { courseSlug } = await params;
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 items-center justify-center px-4 py-12">
      <Suspense fallback={<div className="text-sm text-muted-foreground">Opening course...</div>}>
        <LearnCourseEntryContent courseSlug={courseSlug} />
      </Suspense>
    </main>
  );
}
