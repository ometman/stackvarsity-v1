// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CourseEditorWorkspace } from "@/modules/courses/components/course-editor-workspace";
import { InstructorCourseList } from "@/modules/courses/components/instructor-course-list";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

describe("Instructor authoring UI", () => {
  it("renders assigned courses and toggles the create draft course form", () => {
    render(
      <InstructorCourseList
        initialCourses={[
          {
            id: "c1",
            slug: "cloud-foundations",
            title: "Cloud Foundations",
            summary: "Core cloud architecture",
            category: "Cloud & Linux",
            level: "Beginner",
            status: "DRAFT",
            accessType: "FREE",
            moduleCount: 1,
            lessonCount: 2,
            enrollmentCount: 0,
          },
        ]}
      />
    );

    expect(screen.getByText("Cloud Foundations")).toBeInTheDocument();
    expect(screen.getByText("DRAFT")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /create course/i }));
    expect(screen.getByLabelText(/course title/i)).toBeInTheDocument();
  });

  it("renders course editor metadata, module builder, and publish action", () => {
    render(
      <CourseEditorWorkspace
        initialCourse={{
          id: "c1",
          slug: "cloud-foundations",
          title: "Cloud Foundations",
          summary: "Core cloud architecture",
          overview: "Detailed cloud overview",
          category: "Cloud & Linux",
          level: "Beginner",
          status: "DRAFT",
          accessType: "FREE",
          modules: [
            {
              id: "m1",
              title: "Module 1",
              description: "Intro",
              position: 1,
              lessons: [
                {
                  id: "l1",
                  slug: "intro",
                  title: "Introduction",
                  type: "TEXT",
                  content: "Welcome",
                  videoUrl: null,
                  estimatedMinutes: 5,
                  position: 1,
                  isPublished: true,
                },
              ],
            },
          ],
        }}
      />
    );

    expect(screen.getByRole("heading", { name: "Cloud Foundations" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /publish course/i })).toBeInTheDocument();
    expect(screen.getByText("1. Introduction")).toBeInTheDocument();
  });
});
