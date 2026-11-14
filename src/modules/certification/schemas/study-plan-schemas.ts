import { z } from "zod";

export function isValidIanaTimezone(tz: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export const ianaTimezoneSchema = z
  .string()
  .trim()
  .min(1)
  .max(80)
  .refine(isValidIanaTimezone, "Invalid IANA timezone");

export const createStudyPlanSchema = z.object({
  startDate: z.coerce.date(),
  timezone: ianaTimezoneSchema.default("UTC"),
  weeklyHours: z.number().int().min(1).max(40).default(5),
});

export const rescheduleStudyPlanSchema = z.object({
  newStartDate: z.coerce.date(),
  timezone: ianaTimezoneSchema.optional(),
});

export const toggleStudyTaskSchema = z.object({
  completed: z.boolean(),
});
