import { z } from "zod";

export const CERTIFICATION_ISSUERS = ["Amazon Web Services (AWS)", "CompTIA", "Microsoft"] as const;

export const certificationFilterSchema = z.object({
  issuer: z
    .string()
    .optional()
    .transform((val) => (val && val.trim() && val !== "all" ? val.trim() : "all")),
  level: z
    .string()
    .optional()
    .transform((val) => (val && val.trim() && val !== "all" ? val.trim() : "all")),
  q: z
    .string()
    .optional()
    .transform((val) => (val ? val.trim().slice(0, 120) : "")),
});
