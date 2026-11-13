"use client";

import { ArrowLeft, ArrowRight, CheckCircle2, Circle, ExternalLink, Menu, X } from "lucide-react";
import Link from "next/link";
import { type ReactNode, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SafeLessonContent } from "@/modules/learning/components/safe-lesson-content";

export interface PlayerModuleItem {
  id: string;
  title: string;
  lessons: Array<{
    id: string;
    slug: string;
    title: string;
    type: string;
    estimatedMinutes: number | null;
  }>;
}

export interface LessonPlayerProps {
  mode: "ENROLLED" | "STAFF_PREVIEW";
  course: {
    id: string;
    slug: string;
    title: string;
    status: string;
  };
  modules: PlayerModuleItem[];
  currentLesson: {
    id: string;
    slug: string;
    title: string;
    type: string;
    content: string;
    videoUrl: string | null;
    estimatedMinutes: number | null;
    moduleTitle: string;
    resources: Array<{
      id: string;
      title: string;
      url: string;
      resourceType: string;
    }>;
  };
  previousLesson: { slug: string; title: string } | null;
  nextLesson: { slug: string; title: string } | null;
  completedLessonIds: string[];
  progressPercent: number;
  completionAction?: ReactNode;
}

export function LessonPlayerShell({
  mode,
  course,
  modules,
  currentLesson,
  previousLesson,
  nextLesson,
  completedLessonIds,
  progressPercent,
  completionAction,
}: LessonPlayerProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMobileMenuOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const completedSet = new Set(completedLessonIds);

  const syllabusContent = (
    <nav aria-label="Course curriculum" className="space-y-5">
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Course Progress</span>
          <span className="font-medium text-foreground">{progressPercent}%</span>
        </div>
        <div
          className="h-2 w-full overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuenow={progressPercent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Course progress"
        >
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {modules.map((mod) => (
        <div key={mod.id} className="space-y-2">
          <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            {mod.title}
          </h2>
          <ul className="space-y-1">
            {mod.lessons.map((lesson) => {
              const isCurrent = lesson.id === currentLesson.id;
              const isDone = completedSet.has(lesson.id);

              return (
                <li key={lesson.id}>
                  <Link
                    href={`/learn/${course.slug}/${lesson.slug}`}
                    onClick={() => setMobileMenuOpen(false)}
                    aria-current={isCurrent ? "page" : undefined}
                    className={`flex items-start gap-2 rounded-md px-2.5 py-2 text-sm transition-colors ${
                      isCurrent
                        ? "bg-primary/10 font-medium text-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    {isDone ? (
                      <CheckCircle2
                        className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                        aria-label="Completed"
                      />
                    ) : (
                      <Circle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    )}
                    <span className="flex-1">{lesson.title}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:py-8">
      {mode === "STAFF_PREVIEW" && (
        <div
          role="status"
          className="mb-4 rounded-md border border-border bg-muted/50 px-4 py-2.5 text-xs text-muted-foreground"
        >
          Staff Preview Mode ({course.status}) — Progress tracking is disabled for preview sessions.
        </div>
      )}

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b pb-4">
        <div>
          <Link
            href={mode === "STAFF_PREVIEW" ? "/instructor" : "/student"}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            {mode === "STAFF_PREVIEW" ? "Back to Instructor Dashboard" : "Back to My Learning"}
          </Link>
          <p className="mt-1 text-sm font-medium text-muted-foreground">{course.title}</p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="lg:hidden"
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-curriculum-drawer"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
        >
          {mobileMenuOpen ? (
            <>
              <X className="mr-1.5 h-4 w-4" aria-hidden="true" />
              Close Syllabus
            </>
          ) : (
            <>
              <Menu className="mr-1.5 h-4 w-4" aria-hidden="true" />
              Curriculum
            </>
          )}
        </Button>
      </div>

      {mobileMenuOpen && (
        <div
          id="mobile-curriculum-drawer"
          className="mb-6 rounded-lg border border-border bg-card p-4 lg:hidden"
        >
          {syllabusContent}
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-6 rounded-lg border border-border bg-card p-4">
            {syllabusContent}
          </div>
        </aside>

        <article className="min-w-0 space-y-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">{currentLesson.moduleTitle}</Badge>
              <Badge variant="secondary">{currentLesson.type}</Badge>
              {currentLesson.estimatedMinutes && (
                <span className="text-xs text-muted-foreground">
                  {currentLesson.estimatedMinutes} min read
                </span>
              )}
            </div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {currentLesson.title}
            </h1>
          </div>

          {currentLesson.videoUrl && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Video Lesson Reference</CardTitle>
              </CardHeader>
              <CardContent>
                <a
                  href={currentLesson.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 hover:underline"
                >
                  Open lesson video in new tab
                  <ExternalLink className="h-4 w-4" aria-hidden="true" />
                </a>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="pt-6">
              <SafeLessonContent content={currentLesson.content} />
            </CardContent>
          </Card>

          {currentLesson.resources.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Attached Resources</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {currentLesson.resources.map((res) => (
                    <li key={res.id}>
                      <a
                        href={res.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm text-foreground underline-offset-4 hover:underline"
                      >
                        <span>{res.title}</span>
                        <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                      </a>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          <div className="flex flex-wrap items-center justify-between gap-4 border-t pt-6">
            <div>
              {previousLesson && (
                <Link
                  href={`/learn/${course.slug}/${previousLesson.slug}`}
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  <ArrowLeft className="mr-1.5 h-4 w-4" aria-hidden="true" />
                  Previous: {previousLesson.title}
                </Link>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {completionAction}
              {nextLesson && (
                <Link
                  href={`/learn/${course.slug}/${nextLesson.slug}`}
                  className={buttonVariants({ size: "sm" })}
                >
                  Next: {nextLesson.title}
                  <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden="true" />
                </Link>
              )}
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}
