// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CourseCatalogView } from "@/modules/catalog/components/course-catalog-view";
import { queryPublicCatalog } from "@/modules/catalog/services/catalog-service";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

describe("Public course catalog", () => {
  it("filters courses by category, level, and search keyword", async () => {
    const cloudResult = await queryPublicCatalog({ category: "Cloud & Linux" });
    expect(cloudResult.total).toBeGreaterThan(0);
    expect(cloudResult.items.every((c) => c.category === "Cloud & Linux")).toBe(true);

    const searchResult = await queryPublicCatalog({ q: "linux" });
    expect(searchResult.items.some((c) => c.slug === "linux-command-line-essentials")).toBe(true);

    const emptyResult = await queryPublicCatalog({ q: "nonexistent-topic-xyz" });
    expect(emptyResult.total).toBe(0);
    expect(emptyResult.items).toHaveLength(0);
  });

  it("handles invalid query parameters safely without throwing", async () => {
    const result = await queryPublicCatalog({
      category: "InvalidCategory",
      level: "Expert99",
      page: -5,
    });
    expect(result.appliedFilters.category).toBe("all");
    expect(result.appliedFilters.level).toBe("all");
    expect(result.page).toBe(1);
    expect(result.items.length).toBeGreaterThan(0);
  });

  it("renders accessible empty state and reset control", async () => {
    const emptyResult = await queryPublicCatalog({ q: "does-not-exist" });
    render(<CourseCatalogView result={emptyResult} />);

    expect(screen.getByRole("status")).toHaveTextContent(/no matching courses found/i);
    fireEvent.click(screen.getByRole("button", { name: /reset filters/i }));
    expect(pushMock).toHaveBeenCalledWith("/courses");
  });
});
