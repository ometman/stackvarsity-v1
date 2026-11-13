// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import AboutPage from "@/app/(marketing)/about/page";
import FaqPage from "@/app/(marketing)/faq/page";
import HowItWorksPage from "@/app/(marketing)/how-it-works/page";

describe("About, How It Works, and FAQ pages", () => {
  it("renders About page with verified contact email and mission", () => {
    render(<AboutPage />);
    expect(
      screen.getByRole("heading", { level: 1, name: /about stack varsity/i })
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "hello@mystackvarsity.com" })).toHaveAttribute(
      "href",
      "mailto:hello@mystackvarsity.com"
    );
  });

  it("renders How It Works page distinguishing live vs upcoming stages", () => {
    render(<HowItWorksPage />);
    expect(
      screen.getByRole("heading", { level: 1, name: /how stack varsity works/i })
    ).toBeInTheDocument();
    expect(screen.getAllByText("Live now").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Coming soon").length).toBeGreaterThan(0);
  });

  it("renders FAQ page with keyboard-accessible disclosure buttons", () => {
    render(<FaqPage />);
    const firstQuestion = screen.getByRole("button", {
      name: /what is currently live on stack varsity/i,
    });
    expect(firstQuestion).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(firstQuestion);
    expect(firstQuestion).toHaveAttribute("aria-expanded", "true");
  });
});
