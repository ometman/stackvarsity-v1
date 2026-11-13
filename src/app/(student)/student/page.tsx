import { ArrowRight, BookOpen } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requirePageRole } from "@/modules/auth/route-guards";
import { listUserEnrollments } from "@/modules/enrollments/services/enrollment-service";

export const metadata: Metadata = {
  title: "Student Dashboard",
  description: "Authenticated student workspace for Stack Varsity.",
  robots: { index: false, follow: false },
};

async function StudentDashboardContent() {
  const session = await requirePageRole(["STUDENT", "ADMIN"], "/student");
  const enrollments = await listUserEnrollments(session.user.id);

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">My Learning</h1>
          <p className="text-sm text-muted-foreground">
            Signed in as {session.user.name ?? session.user.email}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge>{session.user.role}</Badge>
          <Link href="/courses" className={buttonVariants({ variant: "outline", size: "sm" })}>
            Browse Courses
          </Link>
        </div>
      </div>

      {enrollments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <BookOpen className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
            <h2 className="mt-3 text-base font-medium">No enrolled courses yet</h2>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              Explore our free self-paced courses to start building practical digital skills.
            </p>
            <Link href="/courses" className={buttonVariants({ className: "mt-4" })}>
              Explore Course Catalog
              <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden="true" />
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {enrollments.map((item) => {
            const targetHref = item.resumeLessonSlug
              ? `/learn/${item.course.slug}/${item.resumeLessonSlug}`
              : `/learn/${item.course.slug}`;

            return (
              <Card key={item.id} className="flex flex-col justify-between">
                <CardHeader>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Badge variant="outline">{item.course.category}</Badge>
                    <Badge variant={item.status === "COMPLETED" ? "default" : "secondary"}>
                      {item.status}
                    </Badge>
                  </div>
                  <CardTitle className="mt-2 text-lg">{item.course.title}</CardTitle>
                  <CardDescription className="line-clamp-2">{item.course.summary}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>
                        {item.progress.completedLessons} of {item.progress.totalLessons} lessons
                        complete
                      </span>
                      <span className="font-medium text-foreground">
                        {item.progress.progressPercent}%
                      </span>
                    </div>
                    <div
                      className="h-2 w-full overflow-hidden rounded-full bg-muted"
                      role="progressbar"
                      aria-valuenow={item.progress.progressPercent}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`${item.course.title} progress`}
                    >
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${item.progress.progressPercent}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    {item.resumeLessonTitle && (
                      <span className="truncate text-xs text-muted-foreground">
                        Next: {item.resumeLessonTitle}
                      </span>
                    )}
                    <Link href={targetHref} className={buttonVariants({ size: "sm" })}>
                      {item.progress.completedLessons > 0 ? "Continue learning" : "Start course"}
                      <ArrowRight className="ml-1.5 h-3.5 w-3.5" aria-hidden="true" />
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function StudentDashboardPage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 justify-center px-4 py-10">
      <Suspense
        fallback={<div className="text-sm text-muted-foreground">Loading workspace...</div>}
      >
        <StudentDashboardContent />
      </Suspense>
    </main>
  );
}
