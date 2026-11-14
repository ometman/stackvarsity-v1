"use client";

import { BookOpen, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { COURSE_CATEGORIES, COURSE_LEVELS } from "@/modules/courses/schemas/course-schemas";

export interface InstructorCourseListItem {
  id: string;
  slug: string;
  title: string;
  summary: string;
  category: string;
  level: string;
  status: string;
  accessType: string;
  moduleCount: number;
  lessonCount: number;
  enrollmentCount: number;
}

interface InstructorCourseListProps {
  initialCourses: InstructorCourseListItem[];
}

export function InstructorCourseList({ initialCourses }: InstructorCourseListProps) {
  const router = useRouter();
  const [courses, setCourses] = useState<InstructorCourseListItem[]>(initialCourses);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [overview, setOverview] = useState("");
  const [category, setCategory] = useState<string>(COURSE_CATEGORIES[0]);
  const [level, setLevel] = useState<string>(COURSE_LEVELS[0]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreateCourse(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const response = await fetch("/api/instructor/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          summary,
          overview,
          category,
          level,
          accessType: "FREE",
        }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        setError(payload?.error ?? "Unable to create course.");
        setSubmitting(false);
        return;
      }

      const created = payload.course;
      setCourses((prev) => [
        {
          id: created.id,
          slug: created.slug,
          title: created.title,
          summary: created.summary,
          category: created.category,
          level: created.level,
          status: created.status,
          accessType: created.accessType,
          moduleCount: 0,
          lessonCount: 0,
          enrollmentCount: 0,
        },
        ...prev,
      ]);
      setTitle("");
      setSummary("");
      setOverview("");
      setShowCreate(false);
      router.push(`/instructor/courses/${created.id}`);
    } catch {
      setError("Network error while creating course.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Assigned Courses</h2>
          <p className="text-sm text-muted-foreground">
            Create draft courses, structure modules and lessons, and submit for publication.
          </p>
        </div>
        <Button
          type="button"
          onClick={() => setShowCreate((prev) => !prev)}
          aria-expanded={showCreate}
        >
          <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
          {showCreate ? "Cancel" : "Create Course"}
        </Button>
      </div>

      {showCreate && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Create Draft Course</CardTitle>
            <CardDescription>
              New courses start in DRAFT status and remain hidden from public discovery until
              published.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateCourse} className="space-y-4">
              {error && (
                <div
                  role="alert"
                  className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                >
                  {error}
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="course-title">Course Title</Label>
                  <Input
                    id="course-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Linux Command Line Essentials"
                    required
                    minLength={3}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="course-category">Category</Label>
                  <select
                    id="course-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs"
                  >
                    {COURSE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="course-level">Level</Label>
                  <select
                    id="course-level"
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs"
                  >
                    {COURSE_LEVELS.map((lvl) => (
                      <option key={lvl} value={lvl}>
                        {lvl}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="course-summary">Short Summary</Label>
                  <Input
                    id="course-summary"
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    placeholder="One-sentence summary shown on catalog cards"
                    required
                    minLength={10}
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="course-overview">Course Overview</Label>
                  <textarea
                    id="course-overview"
                    value={overview}
                    onChange={(e) => setOverview(e.target.value)}
                    placeholder="Detailed description of what learners will cover"
                    rows={4}
                    required
                    minLength={10}
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Creating..." : "Create Draft Course"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {courses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <BookOpen className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
            <h3 className="mt-3 text-base font-medium">No assigned courses yet</h3>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              Create your first draft course to start building modules and lessons.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {courses.map((course) => (
            <Card key={course.id} className="flex flex-col justify-between">
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Badge variant="outline">{course.category}</Badge>
                  <Badge variant={course.status === "PUBLISHED" ? "default" : "secondary"}>
                    {course.status}
                  </Badge>
                </div>
                <CardTitle className="mt-2 text-lg">{course.title}</CardTitle>
                <CardDescription className="line-clamp-2">{course.summary}</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-between gap-4 border-t pt-4 text-xs text-muted-foreground">
                <span>
                  {course.moduleCount} modules · {course.lessonCount} lessons ·{" "}
                  {course.enrollmentCount} enrolled
                </span>
                <Link
                  href={`/instructor/courses/${course.id}`}
                  className={buttonVariants({ size: "sm", variant: "outline" })}
                >
                  Manage
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
