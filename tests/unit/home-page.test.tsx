// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import HomePage from "@/app/(marketing)/page";

describe("Home page component", () => {
  it("renders the Stack Varsity heading and primary discovery CTAs", () => {
    render(<HomePage />);
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /explore courses/i })).toHaveAttribute(
      "href",
      "/courses"
    );
    expect(screen.getByRole("link", { name: /view certification tracks/i })).toHaveAttribute(
      "href",
      "/certifications"
    );
  });
});
