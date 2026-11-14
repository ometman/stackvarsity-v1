import { z } from "zod";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isSafeHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

export const safeHttpUrlSchema = z
  .string()
  .trim()
  .max(500)
  .refine(isSafeHttpUrl, "URL must use http:// or https://");

export const createProviderSchema = z.object({
  slug: z.string().trim().min(2).max(80).regex(slugPattern, "Slug must be lowercase kebab-case"),
  name: z.string().trim().min(2).max(120),
  officialHomepageUrl: safeHttpUrlSchema.optional().nullable(),
  trademarkNotice: z.string().trim().max(500).optional().nullable(),
});

export const createCertificationSchema = z.object({
  providerId: z.string().trim().min(1),
  slug: z.string().trim().min(2).max(120).regex(slugPattern, "Slug must be lowercase kebab-case"),
  name: z.string().trim().min(2).max(160),
  level: z.string().trim().min(2).max(60),
  summary: z.string().trim().min(10).max(1000),
});

export const createExamVersionSchema = z.object({
  certificationId: z.string().trim().min(1),
  examCode: z.string().trim().min(2).max(60),
  versionLabel: z.string().trim().min(2).max(120),
  effectiveFrom: z.coerce.date().optional().nullable(),
  sourceUrl: safeHttpUrlSchema.optional().nullable(),
  verificationStatus: z
    .enum(["VERIFIED", "NEEDS_REVERIFICATION", "UNVERIFIED"])
    .default("NEEDS_REVERIFICATION"),
  sourceNotes: z.string().trim().max(2000).optional().nullable(),
});

export const createDomainSchema = z
  .object({
    examVersionId: z.string().trim().min(1),
    domainKey: z.string().trim().min(1).max(32),
    title: z.string().trim().min(2).max(180),
    description: z.string().trim().max(1000).optional().nullable(),
    weightMinPercent: z.number().int().min(0).max(100).optional().nullable(),
    weightMaxPercent: z.number().int().min(0).max(100).optional().nullable(),
    position: z.number().int().min(1).max(100),
  })
  .refine(
    (data) =>
      data.weightMinPercent == null ||
      data.weightMaxPercent == null ||
      data.weightMinPercent <= data.weightMaxPercent,
    { message: "weightMinPercent cannot exceed weightMaxPercent" }
  );

export const createObjectiveSchema = z.object({
  examVersionId: z.string().trim().min(1),
  domainId: z.string().trim().min(1),
  parentId: z.string().trim().min(1).optional().nullable(),
  objectiveKey: z.string().trim().min(1).max(40),
  title: z.string().trim().min(3).max(240),
  summary: z.string().trim().max(1500).optional().nullable(),
  sourceReference: z.string().trim().max(240).optional().nullable(),
  position: z.number().int().min(1).max(500),
});

export const createTrackSchema = z.object({
  examVersionId: z.string().trim().min(1),
  slug: z.string().trim().min(3).max(120).regex(slugPattern, "Slug must be lowercase kebab-case"),
  title: z.string().trim().min(3).max(160),
  summary: z.string().trim().min(10).max(500),
  overview: z.string().trim().min(20).max(8000),
  accessType: z.enum(["FREE", "PAID"]).default("FREE"),
  intendedAudience: z.array(z.string().trim().min(2).max(200)).max(12).default([]),
  prerequisites: z.array(z.string().trim().min(2).max(200)).max(12).default([]),
  disclaimer: z.string().trim().min(20).max(1500),
});

export const updateTrackSchema = z.object({
  expectedRevision: z.number().int().min(1),
  title: z.string().trim().min(3).max(160).optional(),
  summary: z.string().trim().min(10).max(500).optional(),
  overview: z.string().trim().min(20).max(8000).optional(),
  accessType: z.enum(["FREE", "PAID"]).optional(),
  intendedAudience: z.array(z.string().trim().min(2).max(200)).max(12).optional(),
  prerequisites: z.array(z.string().trim().min(2).max(200)).max(12).optional(),
  disclaimer: z.string().trim().min(20).max(1500).optional(),
});

export const transitionTrackStatusSchema = z.object({
  expectedRevision: z.number().int().min(1),
  targetStatus: z.enum(["DRAFT", "IN_REVIEW", "PUBLISHED", "RETIRED"]),
  reason: z.string().trim().max(500).optional(),
});

export const assignTrackStaffSchema = z.object({
  userId: z.string().trim().min(1),
  role: z.enum(["AUTHOR", "REVIEWER"]),
});
