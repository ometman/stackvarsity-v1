// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MobileNav } from "@/components/layout/mobile-nav";
import { SiteFooter } from "@/components/layout/site-footer";
import { primaryNavItems } from "@/config/navigation";

describe("Marketing layout shell", () => {
  it("toggles mobile navigation with keyboard Escape support", () => {
    render(<MobileNav items={primaryNavItems} isAuthenticated={false} />);

    const toggleButton = screen.getByRole("button", { name: /open navigation menu/i });
    expect(toggleButton).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(toggleButton);
    expect(screen.getByRole("button", { name: /close navigation menu/i })).toHaveAttribute(
      "aria-expanded",
      "true"
    );
    expect(screen.getByRole("navigation", { name: /mobile navigation/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Courses" })).toHaveAttribute("href", "/courses");
    expect(screen.getByRole("link", { name: "Register" })).toHaveAttribute("href", "/register");

    fireEvent.keyDown(window, { key: "Escape" });
    expect(
      screen.queryByRole("navigation", { name: /mobile navigation/i })
    ).not.toBeInTheDocument();
  });

  it("renders footer sections, verified email, and legal links without unverified socials", () => {
    render(<SiteFooter />);

    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "hello@mystackvarsity.com" })).toHaveAttribute(
      "href",
      "mailto:hello@mystackvarsity.com"
    );
    expect(screen.getByRole("link", { name: "Privacy Policy" })).toHaveAttribute(
      "href",
      "/privacy"
    );
    expect(screen.getByRole("link", { name: "Terms of Use" })).toHaveAttribute("href", "/terms");
  });
});
