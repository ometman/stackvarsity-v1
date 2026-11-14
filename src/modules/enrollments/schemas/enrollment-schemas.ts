import { z } from "zod";

export const createEnrollmentSchema = z.object({
  courseId: z.string().trim().min(1, "courseId is required"),
});

export const adminManageEnrollmentSchema = z.object({
  userId: z.string().trim().min(1, "userId is required"),
  courseId: z.string().trim().min(1, "courseId is required"),
  action: z.enum(["GRANT", "REVOKE"]),
});
