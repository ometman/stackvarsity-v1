import { z } from "zod";

export const practiceOptionInputSchema = z.object({
  label: z.string().trim().min(1).max(500),
  isCorrect: z.boolean(),
});

export const createPracticeQuestionSchema = z
  .object({
    objectiveId: z.string().trim().min(1),
    stem: z.string().trim().min(10).max(2000),
    explanation: z.string().trim().min(15).max(2500),
    sourceReference: z.string().trim().max(300).optional().nullable(),
    originType: z.enum(["ORIGINAL_AUTHORED", "LICENSED_PARTNER"]).default("ORIGINAL_AUTHORED"),
    licenseNote: z.string().trim().min(5).max(300),
    options: z.array(practiceOptionInputSchema).min(2).max(6),
  })
  .refine((data) => data.options.filter((o) => o.isCorrect).length === 1, {
    message: "Single-choice formative questions must have exactly one correct option",
  });

export const transitionQuestionStatusSchema = z.object({
  targetStatus: z.enum(["DRAFT", "IN_REVIEW", "PUBLISHED", "RETIRED"]),
});

export const submitPracticeResponseSchema = z.object({
  attemptId: z.string().trim().min(1),
  questionId: z.string().trim().min(1),
  selectedOptionId: z.string().trim().min(1),
  idempotencyKey: z.string().trim().min(8).max(120),
});
