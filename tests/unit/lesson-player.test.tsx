// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LessonPlayerShell } from "@/modules/learning/components/lesson-player-shell";
import { SafeLessonContent } from "@/modules/learning/components/safe-lesson-content";

describe("Protected lesson player & safe content rendering", () => {
  it("renders markdown headings, lists, and bold text without executing raw HTML", () => {
    render(
      <SafeLessonContent
        content={
          "## Core Concepts\n\n- **Zero** raw HTML\n- `code` block\n\n<script>alert(1)</script>"
        }
      />
    );

    expect(screen.getByRole("heading", { level: 2, name: "Core Concepts" })).toBeInTheDocument();
    expect(screen.getByText("Zero")).toBeInTheDocument();
    expect(screen.getByText("<script>alert(1)</script>")).toBeInTheDocument();
  });

  it("renders syllabus sidebar, mobile drawer toggle, and previous/next navigation", () => {
    render(
      <LessonPlayerShell
        mode="ENROLLED"
        course={{
          id: "c1",
          slug: "cloud-foundations",
          title: "Cloud Foundations",
          status: "PUBLISHED",
        }}
        modules={[
          {
            id: "m1",
            title: "Module 1",
            lessons: [
              { id: "l1", slug: "lesson-1", title: "Lesson 1", type: "TEXT", estimatedMinutes: 5 },
              { id: "l2", slug: "lesson-2", title: "Lesson 2", type: "TEXT", estimatedMinutes: 8 },
            ],
          },
        ]}
        currentLesson={{
          id: "l2",
          slug: "lesson-2",
          title: "Lesson 2",
          type: "TEXT",
          content: "Body content",
          videoUrl: null,
          estimatedMinutes: 8,
          moduleTitle: "Module 1",
          resources: [],
        }}
        previousLesson={{ slug: "lesson-1", title: "Lesson 1" }}
        nextLesson={null}
        completedLessonIds={["l1"]}
        progressPercent={50}
      />
    );

    expect(screen.getByRole("heading", { level: 1, name: "Lesson 2" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /previous: lesson 1/i })).toHaveAttribute(
      "href",
      "/learn/cloud-foundations/lesson-1"
    );

    const toggle = screen.getByRole("button", { name: /curriculum/i });
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
  });

  it("blocks un-enrolled learners in getProtectedLessonView (IDOR check)", async () => {
    vi.doMock("@/server/db", () => ({
      getDb: () => ({
        course: {
          findFirst: vi.fn().mockResolvedValue({
            id: "c1",
            slug: "cloud-foundations",
            status: "PUBLISHED",
            archivedAt: null,
            assignments: [],
            enrollments: [],
          }),
        },
      }),
    }));

    const { getProtectedLessonView } =
      await import("@/modules/learning/services/lesson-player-service");
    await expect(
      getProtectedLessonView("student-2", "STUDENT", "cloud-foundations", "lesson-1")
    ).rejects.toThrow(/active enrollment/i);
  });
});
