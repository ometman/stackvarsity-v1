import { z } from "zod";

/**
 * Normalizes email addresses consistently (trim + lowercase).
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export const credentialsLoginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email address is required")
    .max(254, "Email address is too long")
    .email("Please enter a valid email address")
    .transform(normalizeEmail),
  password: z
    .string()
    .min(1, "Password is required")
    .max(128, "Password must be at most 128 characters"),
  rememberMe: z
    .union([z.boolean(), z.literal("true"), z.literal("false"), z.literal("on")])
    .optional()
    .transform((val) => val === true || val === "true" || val === "on"),
});

export type CredentialsLoginInput = z.infer<typeof credentialsLoginSchema>;
