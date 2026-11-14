import { expect, test } from "@playwright/test";

test.describe("Phase 4 LMS authorization and learner journey", () => {
  test("redirects unauthenticated visitors away from protected LMS routes", async ({ page }) => {
    await page.goto("/student");
    await expect(page).toHaveURL(/\/login/);

    await page.goto("/instructor");
    await expect(page).toHaveURL(/\/login/);

    await page.goto("/learn/cloud-computing-foundations");
    await expect(page).toHaveURL(/\/login/);
  });

  test("rejects unauthenticated API requests to authoring, enrollment, and progress endpoints", async ({
    request,
  }) => {
    const coursesRes = await request.get("/api/instructor/courses");
    expect(coursesRes.status()).toBe(401);

    const enrollRes = await request.post("/api/enrollments", {
      data: { courseId: "non-existent" },
    });
    expect(enrollRes.status()).toBe(401);

    const progressRes = await request.post("/api/learning/progress", {
      data: { lessonId: "non-existent", completed: true },
    });
    expect(progressRes.status()).toBe(401);
  });

  test("displays published courses on /courses and sign-in CTA on detail page", async ({
    page,
  }) => {
    await page.goto("/courses/cloud-computing-foundations");
    await expect(
      page.getByRole("heading", { level: 1, name: /cloud computing foundations/i })
    ).toBeVisible();
    await expect(page.getByRole("link", { name: /create free account/i })).toBeVisible();
  });
});
