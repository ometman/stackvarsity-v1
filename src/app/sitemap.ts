import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
import { listPublicCourseSlugs } from "@/modules/catalog/services/catalog-service";
import { listCertificationSlugs } from "@/modules/certification/services/certification-service";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [courseSlugs, certificationSlugs] = await Promise.all([
    listPublicCourseSlugs(),
    listCertificationSlugs(),
  ]);

  const staticPublicRoutes: MetadataRoute.Sitemap = [
    { url: `${siteConfig.url}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${siteConfig.url}/courses`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${siteConfig.url}/certifications`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${siteConfig.url}/how-it-works`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${siteConfig.url}/about`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${siteConfig.url}/faq`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${siteConfig.url}/contact`, changeFrequency: "monthly", priority: 0.6 },
  ];

  const courseRoutes: MetadataRoute.Sitemap = courseSlugs.map((slug) => ({
    url: `${siteConfig.url}/courses/${slug}`,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const certificationRoutes: MetadataRoute.Sitemap = certificationSlugs.map((slug) => ({
    url: `${siteConfig.url}/certifications/${slug}`,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticPublicRoutes, ...courseRoutes, ...certificationRoutes];
}
