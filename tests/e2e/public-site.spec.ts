import { expect, test } from "@playwright/test";

const PUBLIC_ROUTES = [
  "/",
  "/courses",
  "/courses/cloud-computing-foundations",
  "/certifications",
  "/certifications/aws-cloud-practitioner-prep",
  "/about",
  "/how-it-works",
  "/faq",
  "/contact",
];

test.describe("Public website accessibility, routing, and responsive checks", () => {
  for (const route of PUBLIC_ROUTES) {
    test(`loads ${route} with single H1 and landmark regions`, async ({ page }) => {
      const response = await page.goto(route);
      expect(response?.status()).toBe(200);
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page.locator("main#main-content")).toBeVisible();
      await expect(page.locator("footer")).toBeVisible();
    });
  }

  test("returns 404 for unknown course slug", async ({ page }) => {
    const response = await page.goto("/courses/unknown-course-slug-404");
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { level: 1, name: /page not found/i })).toBeVisible();
  });

  test("has no horizontal overflow on 360px mobile viewport and supports mobile menu", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto("/");

    const hasOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth
    );
    expect(hasOverflow).toBe(false);

    const menuButton = page.getByRole("button", { name: /open navigation menu/i });
    await expect(menuButton).toBeVisible();
    await menuButton.click();
    await expect(page.getByRole("navigation", { name: /mobile navigation/i })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("navigation", { name: /mobile navigation/i })).toBeHidden();
  });
});
