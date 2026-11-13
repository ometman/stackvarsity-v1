import type { Metadata } from "next";
import { Suspense } from "react";
import { Badge } from "@/components/ui/badge";
import { requirePageRole } from "@/modules/auth/route-guards";
import {
  InstructorCourseList,
  type InstructorCourseListItem,
} from "@/modules/courses/components/instructor-course-list";
import { listAssignedCourses } from "@/modules/courses/services/course-authoring-service";

export const metadata: Metadata = {
  title: "Instructor Dashboard",
  description: "Authenticated instructor workspace for Stack Varsity.",
  robots: { index: false, follow: false },
};

async function InstructorDashboardContent() {
  const session = await requirePageRole(["INSTRUCTOR", "ADMIN"], "/instructor");
  const rawCourses = await listAssignedCourses(session);

  const courses: InstructorCourseListItem[] = rawCourses.map((course) => ({
    id: course.id,
    slug: course.slug,
    title: course.title,
    summary: course.summary,
    category: course.category,
    level: course.level,
    status: course.status,
    accessType: course.accessType,
    moduleCount: course.modules.length,
    lessonCount: course.modules.reduce((acc, mod) => acc + mod._count.lessons, 0),
    enrollmentCount: course._count.enrollments,
  }));

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Instructor Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Signed in as {session.user.name ?? session.user.email}
          </p>
        </div>
        <Badge>{session.user.role}</Badge>
      </div>
      <InstructorCourseList initialCourses={courses} />
    </div>
  );
}

export default function InstructorDashboardPage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 justify-center px-4 py-10">
      <Suspense
        fallback={<div className="text-sm text-muted-foreground">Loading workspace...</div>}
      >
        <InstructorDashboardContent />
      </Suspense>
    </main>
  );
}
