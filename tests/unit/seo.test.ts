import { describe, expect, it, vi } from "vitest";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";

vi.mock("@/modules/certification/services/certification-service", async () => {
  const { SEED_CERTIFICATION_TRACKS } = await import(
    "@/modules/certification/data/seed-fixtures"
  );
  return {
    listCertificationSlugs: async () => SEED_CERTIFICATION_TRACKS.map((t) => t.track.slug),
  };
});

vi.mock("@/modules/catalog/services/catalog-service", async () => {
  const { ProvisionalCourseCatalogRepository } =
    await import("@/modules/catalog/repositories/course-repository");
  const repo = new ProvisionalCourseCatalogRepository();
  return {
    listPublicCourseSlugs: async () => (await repo.listAll()).map((c) => c.slug),
  };
});
import {
  buildBreadcrumbJsonLd,
  buildOrganizationJsonLd,
  buildWebSiteJsonLd,
  serializeJsonLd,
} from "@/lib/seo/structured-data";

describe("Technical SEO and structured data", () => {
  it("generates sitemap with public discovery routes and excludes private/auth/dev paths", async () => {
    const entries = await sitemap();
    const urls = entries.map((entry) => entry.url);

    expect(urls).toContain("https://www.mystackvarsity.com/");
    expect(urls).toContain("https://www.mystackvarsity.com/courses");
    expect(urls).toContain("https://www.mystackvarsity.com/certifications");
    expect(urls).toContain("https://www.mystackvarsity.com/courses/cloud-computing-foundations");
    expect(urls).toContain(
      "https://www.mystackvarsity.com/certifications/aws-cloud-practitioner-prep"
    );

    const forbidden = ["/admin", "/student", "/instructor", "/dev", "/api", "/login", "/register"];
    for (const path of forbidden) {
      expect(urls.some((url) => url.includes(path))).toBe(false);
    }
  });

  it("configures robots.txt to disallow private, auth, api, and dev routes", () => {
    const config = robots();
    const rules = Array.isArray(config.rules) ? config.rules[0] : config.rules;
    expect(rules?.disallow).toEqual(
      expect.arrayContaining(["/admin", "/student", "/instructor", "/dev", "/api", "/login"])
    );
    expect(config.sitemap).toBe("https://www.mystackvarsity.com/sitemap.xml");
  });

  it("builds valid Organization, WebSite, and BreadcrumbList JSON-LD without unsafe HTML", () => {
    const org = buildOrganizationJsonLd();
    const site = buildWebSiteJsonLd();
    const breadcrumb = buildBreadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Courses", path: "/courses" },
    ]);

    expect(org["@type"]).toBe("Organization");
    expect(site["@type"]).toBe("WebSite");
    expect(breadcrumb.itemListElement).toHaveLength(2);

    const serialized = serializeJsonLd({ test: "<script>alert(1)</script>" });
    expect(serialized).not.toContain("<script>");
    expect(serialized).toContain("\\u003cscript>");
  });
});
