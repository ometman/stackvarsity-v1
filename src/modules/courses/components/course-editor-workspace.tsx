"use client";

import { ArrowLeft, Eye, Plus, Send } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { COURSE_CATEGORIES, COURSE_LEVELS } from "@/modules/courses/schemas/course-schemas";

export interface EditorLesson {
  id: string;
  slug: string;
  title: string;
  type: "TEXT" | "VIDEO" | "RESOURCE";
  content: string;
  videoUrl: string | null;
  estimatedMinutes: number | null;
  position: number;
  isPublished: boolean;
}

export interface EditorModule {
  id: string;
  title: string;
  description: string | null;
  position: number;
  lessons: EditorLesson[];
}

export interface EditorCourse {
  id: string;
  slug: string;
  title: string;
  summary: string;
  overview: string;
  category: string;
  level: string;
  status: "DRAFT" | "IN_REVIEW" | "APPROVED" | "PUBLISHED" | "ARCHIVED";
  accessType: "FREE" | "PAID";
  modules: EditorModule[];
}

interface CourseEditorWorkspaceProps {
  initialCourse: EditorCourse;
}

export function CourseEditorWorkspace({ initialCourse }: CourseEditorWorkspaceProps) {
  const router = useRouter();
  const [course, setCourse] = useState<EditorCourse>(initialCourse);
  const [title, setTitle] = useState(initialCourse.title);
  const [summary, setSummary] = useState(initialCourse.summary);
  const [overview, setOverview] = useState(initialCourse.overview);
  const [category, setCategory] = useState(initialCourse.category);
  const [level, setLevel] = useState(initialCourse.level);

  const [newModuleTitle, setNewModuleTitle] = useState("");
  const [newModuleDesc, setNewModuleDesc] = useState("");

  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonType, setLessonType] = useState<"TEXT" | "VIDEO" | "RESOURCE">("TEXT");
  const [lessonContent, setLessonContent] = useState("");
  const [lessonVideoUrl, setLessonVideoUrl] = useState("");
  const [lessonMinutes, setLessonMinutes] = useState("10");
  const [resourceTitle, setResourceTitle] = useState("");
  const [resourceUrl, setResourceUrl] = useState("");

  const [busy, setBusy] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSaveMetadata(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      const response = await fetch(`/api/instructor/courses/${course.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, summary, overview, category, level }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        setErrorMessage(payload?.error ?? "Unable to save course metadata.");
        return;
      }
      setCourse((prev) => ({
        ...prev,
        title: payload.course.title,
        summary: payload.course.summary,
        overview: payload.course.overview,
        category: payload.course.category,
        level: payload.course.level,
      }));
      setStatusMessage("Course metadata saved.");
      router.refresh();
    } catch {
      setErrorMessage("Network error while saving metadata.");
    } finally {
      setBusy(false);
    }
  }

  async function handleTransitionStatus(targetStatus: EditorCourse["status"]) {
    setBusy(true);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      const response = await fetch(`/api/instructor/courses/${course.id}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetStatus }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        setErrorMessage(payload?.error ?? `Unable to transition to ${targetStatus}.`);
        return;
      }
      setCourse((prev) => ({ ...prev, status: payload.course.status }));
      setStatusMessage(`Course status updated to ${payload.course.status}.`);
      router.refresh();
    } catch {
      setErrorMessage("Network error while updating course status.");
    } finally {
      setBusy(false);
    }
  }

  async function handleAddModule(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      const response = await fetch(`/api/instructor/courses/${course.id}/modules`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newModuleTitle,
          description: newModuleDesc || null,
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        setErrorMessage(payload?.error ?? "Unable to create module.");
        return;
      }
      setCourse((prev) => ({
        ...prev,
        modules: [...prev.modules, { ...payload.module, lessons: [] }],
      }));
      setNewModuleTitle("");
      setNewModuleDesc("");
      setStatusMessage("Module added.");
      router.refresh();
    } catch {
      setErrorMessage("Network error while adding module.");
    } finally {
      setBusy(false);
    }
  }

  async function handleAddLesson(event: React.FormEvent<HTMLFormElement>, moduleId: string) {
    event.preventDefault();
    setBusy(true);
    setErrorMessage(null);
    setStatusMessage(null);

    const resources =
      resourceTitle.trim() && resourceUrl.trim()
        ? [{ title: resourceTitle.trim(), url: resourceUrl.trim(), resourceType: "LINK" as const }]
        : undefined;

    try {
      const response = await fetch(`/api/instructor/modules/${moduleId}/lessons`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: lessonTitle,
          type: lessonType,
          content: lessonContent,
          videoUrl: lessonVideoUrl.trim() ? lessonVideoUrl.trim() : null,
          estimatedMinutes: Number(lessonMinutes) > 0 ? Number(lessonMinutes) : null,
          isPublished: true,
          resources,
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        setErrorMessage(payload?.error ?? "Unable to create lesson.");
        return;
      }
      setCourse((prev) => ({
        ...prev,
        modules: prev.modules.map((mod) =>
          mod.id === moduleId ? { ...mod, lessons: [...mod.lessons, payload.lesson] } : mod
        ),
      }));
      setActiveModuleId(null);
      setLessonTitle("");
      setLessonContent("");
      setLessonVideoUrl("");
      setResourceTitle("");
      setResourceUrl("");
      setStatusMessage("Lesson added.");
      router.refresh();
    } catch {
      setErrorMessage("Network error while adding lesson.");
    } finally {
      setBusy(false);
    }
  }

  const hasLessons = course.modules.some((m) => m.lessons.length > 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <Link
            href="/instructor"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to Instructor Dashboard
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">{course.title}</h1>
            <Badge variant={course.status === "PUBLISHED" ? "default" : "secondary"}>
              {course.status}
            </Badge>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {hasLessons && (
            <Link
              href={`/learn/${course.slug}`}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              <Eye className="mr-1.5 h-4 w-4" aria-hidden="true" />
              Preview Player
            </Link>
          )}
          {course.status === "DRAFT" && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={() => handleTransitionStatus("IN_REVIEW")}
            >
              Submit for Review
            </Button>
          )}
          {course.status !== "PUBLISHED" && course.status !== "ARCHIVED" && (
            <Button
              type="button"
              size="sm"
              disabled={busy}
              onClick={() => handleTransitionStatus("PUBLISHED")}
            >
              <Send className="mr-1.5 h-4 w-4" aria-hidden="true" />
              Publish Course
            </Button>
          )}
          {course.status === "PUBLISHED" && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={() => handleTransitionStatus("ARCHIVED")}
            >
              Archive
            </Button>
          )}
        </div>
      </div>

      {errorMessage && (
        <div
          role="alert"
          className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {errorMessage}
        </div>
      )}
      {statusMessage && (
        <div
          role="status"
          className="rounded-md border border-border bg-muted/50 px-4 py-3 text-sm text-foreground"
        >
          {statusMessage}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Course Metadata</CardTitle>
          <CardDescription>
            Slug: <code>{course.slug}</code> · Access: {course.accessType}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveMetadata} className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-category">Category</Label>
              <select
                id="edit-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
              >
                {COURSE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-level">Level</Label>
              <select
                id="edit-level"
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
              >
                {COURSE_LEVELS.map((lvl) => (
                  <option key={lvl} value={lvl}>
                    {lvl}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="edit-summary">Summary</Label>
              <Input
                id="edit-summary"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="edit-overview">Overview</Label>
              <textarea
                id="edit-overview"
                value={overview}
                onChange={(e) => setOverview(e.target.value)}
                rows={4}
                required
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            <div className="flex justify-end sm:col-span-2">
              <Button type="submit" disabled={busy}>
                Save Metadata
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Curriculum Modules & Lessons</CardTitle>
          <CardDescription>
            Add at least one module and one published lesson before publishing.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {course.modules.map((mod) => (
            <div key={mod.id} className="rounded-lg border border-border p-4 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="font-medium">
                    {mod.position}. {mod.title}
                  </h3>
                  {mod.description && (
                    <p className="text-sm text-muted-foreground">{mod.description}</p>
                  )}
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setActiveModuleId(activeModuleId === mod.id ? null : mod.id)}
                >
                  <Plus className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
                  Add Lesson
                </Button>
              </div>

              {mod.lessons.length > 0 ? (
                <ul className="space-y-2">
                  {mod.lessons.map((lesson) => (
                    <li
                      key={lesson.id}
                      className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-2 text-sm"
                    >
                      <span>
                        {lesson.position}. {lesson.title}
                      </span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{lesson.type}</Badge>
                        {lesson.estimatedMinutes && (
                          <span className="text-xs text-muted-foreground">
                            {lesson.estimatedMinutes} min
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-muted-foreground">No lessons in this module yet.</p>
              )}

              {activeModuleId === mod.id && (
                <form
                  onSubmit={(e) => handleAddLesson(e, mod.id)}
                  className="space-y-3 rounded-md border border-border bg-muted/20 p-4"
                >
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="space-y-1 sm:col-span-2">
                      <Label htmlFor={`lesson-title-${mod.id}`}>Lesson Title</Label>
                      <Input
                        id={`lesson-title-${mod.id}`}
                        value={lessonTitle}
                        onChange={(e) => setLessonTitle(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor={`lesson-type-${mod.id}`}>Type</Label>
                      <select
                        id={`lesson-type-${mod.id}`}
                        value={lessonType}
                        onChange={(e) =>
                          setLessonType(e.target.value as "TEXT" | "VIDEO" | "RESOURCE")
                        }
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                      >
                        <option value="TEXT">TEXT</option>
                        <option value="VIDEO">VIDEO</option>
                        <option value="RESOURCE">RESOURCE</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor={`lesson-content-${mod.id}`}>Lesson Content (Markdown)</Label>
                    <textarea
                      id={`lesson-content-${mod.id}`}
                      value={lessonContent}
                      onChange={(e) => setLessonContent(e.target.value)}
                      rows={5}
                      required
                      className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1">
                      <Label htmlFor={`lesson-video-${mod.id}`}>Video URL (optional https)</Label>
                      <Input
                        id={`lesson-video-${mod.id}`}
                        value={lessonVideoUrl}
                        onChange={(e) => setLessonVideoUrl(e.target.value)}
                        placeholder="https://..."
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor={`lesson-minutes-${mod.id}`}>Estimated Minutes</Label>
                      <Input
                        id={`lesson-minutes-${mod.id}`}
                        type="number"
                        min={1}
                        max={600}
                        value={lessonMinutes}
                        onChange={(e) => setLessonMinutes(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor={`res-title-${mod.id}`}>Resource Title (optional)</Label>
                      <Input
                        id={`res-title-${mod.id}`}
                        value={resourceTitle}
                        onChange={(e) => setResourceTitle(e.target.value)}
                        placeholder="Official Docs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor={`res-url-${mod.id}`}>Resource URL (optional https)</Label>
                      <Input
                        id={`res-url-${mod.id}`}
                        value={resourceUrl}
                        onChange={(e) => setResourceUrl(e.target.value)}
                        placeholder="https://..."
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setActiveModuleId(null)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" size="sm" disabled={busy}>
                      Save Lesson
                    </Button>
                  </div>
                </form>
              )}
            </div>
          ))}

          <form onSubmit={handleAddModule} className="space-y-3 border-t pt-4">
            <h3 className="text-sm font-medium">Add New Module</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="new-module-title">Module Title</Label>
                <Input
                  id="new-module-title"
                  value={newModuleTitle}
                  onChange={(e) => setNewModuleTitle(e.target.value)}
                  placeholder="e.g., Module 1: Getting Started"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="new-module-desc">Description (optional)</Label>
                <Input
                  id="new-module-desc"
                  value={newModuleDesc}
                  onChange={(e) => setNewModuleDesc(e.target.value)}
                  placeholder="Short module summary"
                />
              </div>
            </div>
            <Button type="submit" size="sm" variant="outline" disabled={busy}>
              <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" />
              Add Module
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
