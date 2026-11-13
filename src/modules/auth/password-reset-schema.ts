import { z } from "zod";
import { passwordPolicySchema } from "./registration-schema";

export const forgotPasswordSchema = z
  .object({
    email: z
      .string()
      .trim()
      .min(1, "Email address is required")
      .max(254, "Email address must be at most 254 characters")
      .email("Please enter a valid email address")
      .transform((val) => val.toLowerCase()),
  })
  .strict();

export const resetPasswordSchema = z
  .object({
    token: z.string().trim().min(16, "Invalid or missing reset token").max(256),
    password: passwordPolicySchema,
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .strict()
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
