import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ForbiddenError } from "@/modules/auth/errors";
import { requirePageRole } from "@/modules/auth/route-guards";
import {
  CourseEditorWorkspace,
  type EditorCourse,
} from "@/modules/courses/components/course-editor-workspace";
import {
  CourseServiceError,
  getCourseForEditor,
} from "@/modules/courses/services/course-authoring-service";

export const metadata: Metadata = {
  title: "Course Editor",
  description: "Instructor course and syllabus editor.",
  robots: { index: false, follow: false },
};

interface CourseEditorPageProps {
  params: Promise<{ courseId: string }>;
}

async function CourseEditorContent({ params }: CourseEditorPageProps) {
  const { courseId } = await params;
  const session = await requirePageRole(["INSTRUCTOR", "ADMIN"], `/instructor/courses/${courseId}`);

  let course;
  try {
    course = await getCourseForEditor(session, courseId);
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return (
        <div role="alert" className="rounded-lg border border-destructive/40 p-6 text-sm">
          <h1 className="text-lg font-semibold">Access Denied</h1>
          <p className="mt-1 text-muted-foreground">
            You are not assigned as an instructor for this course.
          </p>
        </div>
      );
    }
    if (error instanceof CourseServiceError && error.statusCode === 404) {
      notFound();
    }
    throw error;
  }

  const initialCourse: EditorCourse = {
    id: course.id,
    slug: course.slug,
    title: course.title,
    summary: course.summary,
    overview: course.overview,
    category: course.category,
    level: course.level,
    status: course.status,
    accessType: course.accessType,
    modules: course.modules.map((mod) => ({
      id: mod.id,
      title: mod.title,
      description: mod.description,
      position: mod.position,
      lessons: mod.lessons.map((lesson) => ({
        id: lesson.id,
        slug: lesson.slug,
        title: lesson.title,
        type: lesson.type,
        content: lesson.content,
        videoUrl: lesson.videoUrl,
        estimatedMinutes: lesson.estimatedMinutes,
        position: lesson.position,
        isPublished: lesson.isPublished,
      })),
    })),
  };

  return <CourseEditorWorkspace initialCourse={initialCourse} />;
}

export default function InstructorCourseEditorPage({ params }: CourseEditorPageProps) {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
      <Suspense fallback={<div className="text-sm text-muted-foreground">Loading editor...</div>}>
        <CourseEditorContent params={params} />
      </Suspense>
    </main>
  );
}
