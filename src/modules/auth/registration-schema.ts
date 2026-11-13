import { z } from "zod";

/**
 * Shared strong password policy used across registration and password reset.
 */
export const passwordPolicySchema = z
  .string()
  .min(10, "Password must be at least 10 characters")
  .max(128, "Password must be at most 128 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character");

/**
 * Strict student registration schema.
 * `.strict()` rejects any injected privilege or internal fields (e.g., role, status, emailVerified).
 */
export const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Full name must be at least 2 characters")
      .max(100, "Full name must be at most 100 characters"),
    email: z
      .string()
      .trim()
      .min(1, "Email address is required")
      .max(254, "Email address must be at most 254 characters")
      .email("Please enter a valid email address")
      .transform((val) => val.toLowerCase()),
    password: passwordPolicySchema,
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .strict()
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;
