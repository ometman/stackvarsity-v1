// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CourseEnrollmentCta } from "@/modules/enrollments/components/course-enrollment-cta";

const pushMock = vi.fn();
const refreshMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
    refresh: refreshMock,
  }),
}));

describe("CourseEnrollmentCta", () => {
  it("renders register and sign-in links for unauthenticated visitors", () => {
    render(
      <CourseEnrollmentCta
        courseId="c1"
        courseSlug="cloud-computing-foundations"
        accessType="FREE"
        isAuthenticated={false}
        isEnrolled={false}
      />
    );

    expect(screen.getByRole("link", { name: /create free account/i })).toHaveAttribute(
      "href",
      "/register"
    );
    expect(screen.getByRole("link", { name: /sign in to enroll/i })).toHaveAttribute(
      "href",
      "/login?next=%2Fcourses%2Fcloud-computing-foundations"
    );
  });

  it("renders Continue learning link when already enrolled", () => {
    render(
      <CourseEnrollmentCta
        courseId="c1"
        courseSlug="cloud-computing-foundations"
        accessType="FREE"
        isAuthenticated={true}
        isEnrolled={true}
      />
    );

    expect(screen.getByRole("link", { name: /continue learning/i })).toHaveAttribute(
      "href",
      "/learn/cloud-computing-foundations"
    );
  });

  it("enrolls authenticated learner and redirects to /learn/[courseSlug]", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ created: true }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <CourseEnrollmentCta
        courseId="c1"
        courseSlug="cloud-computing-foundations"
        accessType="FREE"
        isAuthenticated={true}
        isEnrolled={false}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /enroll for free/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/enrollments",
        expect.objectContaining({ method: "POST" })
      );
      expect(pushMock).toHaveBeenCalledWith("/learn/cloud-computing-foundations");
    });

    vi.unstubAllGlobals();
  });
});
