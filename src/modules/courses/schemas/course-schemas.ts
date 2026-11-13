import { z } from "zod";

export const COURSE_CATEGORIES = [
  "AI & Automation",
  "Cloud & Linux",
  "Cybersecurity",
  "Networking",
  "Web Development",
  "Data Analytics",
] as const;

export const COURSE_LEVELS = ["Beginner", "Foundational", "Intermediate"] as const;

export const safeHttpUrlSchema = z
  .string()
  .trim()
  .url("Must be a valid URL")
  .refine(
    (value) => {
      try {
        const parsed = new URL(value);
        return parsed.protocol === "https:" || parsed.protocol === "http:";
      } catch {
        return false;
      }
    },
    { message: "Only http:// and https:// URLs are permitted" }
  );

export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must contain lowercase letters, numbers, and hyphens")
  .min(3)
  .max(100);

export function slugifyTitle(title: string): string {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return base.length >= 3 ? base : `course-${Date.now()}`;
}

export const createCourseSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(140),
  slug: slugSchema.optional(),
  summary: z.string().trim().min(10, "Summary must be at least 10 characters").max(400),
  overview: z.string().trim().min(10, "Overview must be at least 10 characters").max(5000),
  category: z.enum(COURSE_CATEGORIES),
  level: z.enum(COURSE_LEVELS),
  modality: z.string().trim().min(2).max(60).default("Self-paced"),
  accessType: z.enum(["FREE", "PAID"]).default("FREE"),
  intendedAudience: z.array(z.string().trim().min(2).max(200)).max(10).default([]),
  prerequisites: z.array(z.string().trim().min(2).max(200)).max(10).default([]),
  learningOutcomes: z.array(z.string().trim().min(2).max(200)).max(12).default([]),
  relatedCertificationSlug: z.string().trim().max(100).optional().nullable(),
});

export const updateCourseSchema = createCourseSchema.partial();

export const createModuleSchema = z.object({
  title: z.string().trim().min(2, "Module title must be at least 2 characters").max(140),
  description: z.string().trim().max(500).optional().nullable(),
  position: z.number().int().positive().optional(),
});

export const updateModuleSchema = z.object({
  moduleId: z.string().trim().min(1),
  title: z.string().trim().min(2).max(140).optional(),
  description: z.string().trim().max(500).optional().nullable(),
  position: z.number().int().positive().optional(),
  archived: z.boolean().optional(),
});

export const lessonResourceInputSchema = z.object({
  title: z.string().trim().min(2).max(120),
  url: safeHttpUrlSchema,
  resourceType: z.enum(["LINK", "PDF", "DOCUMENT"]).default("LINK"),
});

export const createLessonSchema = z.object({
  title: z.string().trim().min(2, "Lesson title must be at least 2 characters").max(140),
  slug: slugSchema.optional(),
  type: z.enum(["TEXT", "VIDEO", "RESOURCE"]).default("TEXT"),
  content: z.string().trim().min(1, "Lesson content is required").max(25000),
  videoUrl: safeHttpUrlSchema.optional().nullable(),
  estimatedMinutes: z.number().int().min(1).max(600).optional().nullable(),
  position: z.number().int().positive().optional(),
  isPublished: z.boolean().default(true),
  resources: z.array(lessonResourceInputSchema).max(10).optional(),
});

export const updateLessonSchema = z.object({
  lessonId: z.string().trim().min(1),
  title: z.string().trim().min(2).max(140).optional(),
  type: z.enum(["TEXT", "VIDEO", "RESOURCE"]).optional(),
  content: z.string().trim().min(1).max(25000).optional(),
  videoUrl: safeHttpUrlSchema.optional().nullable(),
  estimatedMinutes: z.number().int().min(1).max(600).optional().nullable(),
  position: z.number().int().positive().optional(),
  isPublished: z.boolean().optional(),
  archived: z.boolean().optional(),
  resources: z.array(lessonResourceInputSchema).max(10).optional(),
});

export const transitionCourseStatusSchema = z.object({
  targetStatus: z.enum(["DRAFT", "IN_REVIEW", "APPROVED", "PUBLISHED", "ARCHIVED"]),
});

export const assignInstructorSchema = z.object({
  userId: z.string().trim().min(1, "Instructor userId is required"),
});
