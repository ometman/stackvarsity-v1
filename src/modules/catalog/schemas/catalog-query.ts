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

export const catalogQuerySchema = z.object({
  q: z
    .string()
    .trim()
    .max(80)
    .optional()
    .transform((val) => val ?? ""),
  category: z
    .string()
    .optional()
    .transform((val) =>
      val && (COURSE_CATEGORIES as readonly string[]).includes(val)
        ? (val as (typeof COURSE_CATEGORIES)[number])
        : "all"
    ),
  level: z
    .string()
    .optional()
    .transform((val) =>
      val && (COURSE_LEVELS as readonly string[]).includes(val)
        ? (val as (typeof COURSE_LEVELS)[number])
        : "all"
    ),
  page: z.coerce.number().int().min(1).max(100).optional().default(1),
});

export type ParsedCatalogQuery = z.infer<typeof catalogQuerySchema>;
