// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import CertificationDetailPage, {
  generateMetadata,
} from "@/app/(marketing)/certifications/[slug]/page";
import CertificationsPage from "@/app/(marketing)/certifications/page";

vi.mock("@/modules/certification/services/certification-service", async () => {
  const { SEED_CERTIFICATION_TRACKS } = await import(
    "@/modules/certification/data/seed-fixtures"
  );
  const mapped = SEED_CERTIFICATION_TRACKS.map((item, idx) => ({
    id: `track-${idx + 1}`,
    slug: item.track.slug,
    title: item.track.title,
    targetCertification: `${item.certification.name} (${item.examVersion.examCode})`,
    issuer: item.provider.name,
    level: item.certification.level,
    summary: item.track.summary,
    overview: item.track.overview,
    availability: "Free Preparation Track",
    isProvisional: false,
    examCode: item.examVersion.examCode,
    versionLabel: item.examVersion.versionLabel,
    accessType: "FREE" as const,
    audience: item.track.intendedAudience,
    prerequisites: item.track.prerequisites,
    preparationTopics: item.domains.map((d) => d.title),
    learningPathway: ["Review domains", "Complete mapped lessons", "Practice formative items"],
    relatedCourseSlug: item.track.relatedCourseSlug,
    disclaimer: item.track.disclaimer,
    sourceUrl: item.examVersion.sourceUrl,
    verifiedAt: "2026-11-14T00:00:00.000Z",
    lastReviewedAt: "2026-11-14T00:00:00.000Z",
    trademarkNotice: item.provider.trademarkNotice,
    domains: item.domains.map((d, dIdx) => ({
      id: `dom-${dIdx}`,
      domainKey: d.domainKey,
      title: d.title,
      description: d.description,
      weightMinPercent: null,
      weightMaxPercent: null,
      objectives: d.objectives.map((o, oIdx) => ({
        id: `obj-${oIdx}`,
        objectiveKey: o.objectiveKey,
        title: o.title,
        summary: o.summary,
      })),
    })),
  }));

  return {
    listCertificationTracks: async () => mapped,
    getCertificationTrackBySlug: async (slug: string) =>
      mapped.find((t) => t.slug === slug) ?? null,
    listCertificationSlugs: async () => mapped.map((t) => t.slug),
  };
});

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
