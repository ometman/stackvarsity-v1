import { z } from "zod";

export const CERTIFICATION_ISSUERS = ["Amazon Web Services (AWS)", "CompTIA", "Microsoft"] as const;

export const certificationFilterSchema = z.object({
  issuer: z
    .string()
    .optional()
    .transform((val) =>
      val && (CERTIFICATION_ISSUERS as readonly string[]).includes(val)
        ? (val as (typeof CERTIFICATION_ISSUERS)[number])
        : "all"
    ),
});
