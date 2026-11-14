import { z } from "zod";

export const createObjectiveMappingSchema = z
  .object({
    objectiveId: z.string().trim().min(1),
    courseId: z.string().trim().min(1).optional().nullable(),
    lessonId: z.string().trim().min(1).optional().nullable(),
    isRequired: z.boolean().default(true),
    position: z.number().int().min(1).max(500).default(1),
    notes: z.string().trim().max(500).optional().nullable(),
  })
  .refine((data) => Boolean(data.courseId || data.lessonId), {
    message: "At least one of courseId or lessonId is required",
  });
