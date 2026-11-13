import { expect, test } from "@playwright/test";

test.describe("Smoke tests", () => {
  test("homepage loads and renders primary heading", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });
});
