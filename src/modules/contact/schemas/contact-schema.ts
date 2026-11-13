import { z } from "zod";

export const CONTACT_TOPICS = [
  "General Inquiry",
  "Course Information",
  "Certification Prep",
  "Technical Support",
] as const;

export const contactSubmissionSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name (at least 2 characters).").max(80),
  email: z.string().trim().email("Please enter a valid email address.").max(120),
  topic: z.enum(CONTACT_TOPICS, {
    message: "Please select an inquiry topic.",
  }),
  message: z
    .string()
    .trim()
    .min(10, "Please enter a message of at least 10 characters.")
    .max(2000, "Message must be 2000 characters or fewer."),
  consent: z.literal(true, {
    message: "Please confirm you have read our draft privacy notice before submitting.",
  }),
  // Honeypot field: must remain empty for legitimate human submissions.
  website: z.string().max(100).optional().default(""),
});

export type ContactSubmissionInput = z.infer<typeof contactSubmissionSchema>;
