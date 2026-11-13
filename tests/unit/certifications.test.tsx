// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import CertificationDetailPage, {
  generateMetadata,
} from "@/app/(marketing)/certifications/[slug]/page";
import CertificationsPage from "@/app/(marketing)/certifications/page";

const notFoundMock = vi.fn(() => {
  throw new Error("NEXT_NOT_FOUND");
});

vi.mock("next/navigation", () => ({
  notFound: () => notFoundMock(),
}));

describe("Certification preparation pages", () => {
  it("renders certification directory with non-affiliation disclaimer", async () => {
    const element = await CertificationsPage();
    render(element);

    expect(
      screen.getByRole("heading", { level: 1, name: /certification preparation directory/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("note", { name: /third-party certification disclaimer/i })
    ).toHaveTextContent(/not affiliated with, endorsed by/i);
    expect(screen.getByText(/aws certified cloud practitioner prep/i)).toBeInTheDocument();
  });

  it("renders certification track detail with disclaimer and related course link", async () => {
    const element = await CertificationDetailPage({
      params: Promise.resolve({ slug: "aws-cloud-practitioner-prep" }),
    });
    render(element);

    expect(
      screen.getByRole("heading", { level: 1, name: /aws certified cloud practitioner prep/i })
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /view related course/i })).toHaveAttribute(
      "href",
      "/courses/cloud-computing-foundations"
    );
  });

  it("generates canonical metadata and calls notFound() for unknown track", async () => {
    const meta = await generateMetadata({
      params: Promise.resolve({ slug: "comptia-security-plus-prep" }),
    });
    expect(meta.alternates?.canonical).toBe("/certifications/comptia-security-plus-prep");

    await expect(
      CertificationDetailPage({
        params: Promise.resolve({ slug: "unknown-cert-track" }),
      })
    ).rejects.toThrow("NEXT_NOT_FOUND");
    expect(notFoundMock).toHaveBeenCalled();
  });
});
