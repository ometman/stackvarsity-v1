// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import CourseDetailPage, { generateMetadata } from "@/app/(marketing)/courses/[slug]/page";

const notFoundMock = vi.fn(() => {
  throw new Error("NEXT_NOT_FOUND");
});

vi.mock("next/navigation", () => ({
  notFound: () => notFoundMock(),
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

vi.mock("@/modules/auth/server-auth", () => ({
  getCurrentSession: vi.fn().mockResolvedValue(null),
}));

vi.mock("@/modules/enrollments/services/enrollment-service", () => ({
  getUserEnrollmentForCourse: vi.fn().mockResolvedValue(null),
}));

vi.mock("@/modules/catalog/services/catalog-service", async () => {
  const { ProvisionalCourseCatalogRepository } =
    await import("@/modules/catalog/repositories/course-repository");
  const repo = new ProvisionalCourseCatalogRepository();
  return {
    getPublicCourseBySlug: (slug: string) => repo.findBySlug(slug),
    listPublicCourseSlugs: async () => (await repo.listAll()).map((c) => c.slug),
  };
});

describe("Public course detail page", () => {
  it("renders course details, learning outcomes, and registration CTA for a valid slug", async () => {
    const element = await CourseDetailPage({
      params: Promise.resolve({ slug: "cloud-computing-foundations" }),
    });
    render(element);

    expect(
      screen.getByRole("heading", { level: 1, name: /cloud computing foundations/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/distinguish iaas, paas, and saas/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /create free account/i })).toHaveAttribute(
      "href",
      "/register"
    );
  });

  it("generates accurate metadata and canonical URL for a valid slug", async () => {
    const meta = await generateMetadata({
      params: Promise.resolve({ slug: "cloud-computing-foundations" }),
    });
    expect(meta.title).toBe("Cloud Computing Foundations");
    expect(meta.alternates?.canonical).toBe("/courses/cloud-computing-foundations");
  });

  it("invokes notFound() for an unknown course slug", async () => {
    await expect(
      CourseDetailPage({
        params: Promise.resolve({ slug: "non-existent-course" }),
      })
    ).rejects.toThrow("NEXT_NOT_FOUND");
    expect(notFoundMock).toHaveBeenCalled();
  });
});
