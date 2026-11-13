import { z } from "zod";

export const setLessonCompletionSchema = z.object({
  lessonId: z.string().trim().min(1, "lessonId is required"),
  completed: z.boolean(),
});
