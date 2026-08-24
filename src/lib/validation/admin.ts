import { z } from "zod";
import {
  wallClockTimeSchema,
  weekdaySchema,
  workingIntervalSchema,
} from "@/lib/validation/schedule";
import { bookingRulesSchema } from "@/lib/validation/shop-config";

/**
 * Admin authored input shapes. LocalizedText editors submit en (required)
 * and ne (optional); empty ne collapses to undefined so the fallback path
 * in resolveLocalizedText keeps working.
 */

export const localizedInputSchema = z.object({
  en: z.string().trim().min(1).max(160),
  ne: z.string().trim().max(160).optional(),
});
export type LocalizedInput = z.infer<typeof localizedInputSchema>;

export const optionalLocalizedInputSchema = z.object({
  en: z.string().trim().min(1).max(400),
  ne: z.string().trim().max(400).optional(),
});

export const serviceInputSchema = z.object({
  name: localizedInputSchema,
  description: optionalLocalizedInputSchema.optional(),
  durationMinutes: z.number().int().min(5).max(480),
  bufferMinutes: z.number().int().min(0).max(120),
  priceCents: z.number().int().min(0).max(100_000_000),
});

export const barberInputSchema = z.object({
  displayName: z.string().trim().min(1).max(120),
  bio: optionalLocalizedInputSchema.optional(),
});

export const dayHoursInputSchema = z.array(
  z.object({
    weekday: weekdaySchema,
    intervals: z.array(workingIntervalSchema).max(4),
  }),
);

export const breakInputSchema = z
  .object({
    barberId: z.uuid().nullable(),
    kind: z.enum(["RECURRING", "ONE_OFF"]),
    weekday: weekdaySchema.nullable(),
    oneOffDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .nullable(),
    startTime: wallClockTimeSchema,
    endTime: wallClockTimeSchema,
    reason: z.string().trim().max(200).nullable(),
  })
  .refine((input) => input.startTime < input.endTime, { message: "End must be after start" })
  .refine(
    (input) => (input.kind === "RECURRING" ? input.weekday !== null : input.oneOffDate !== null),
    {
      message: "Recurring needs a weekday; one-off needs a date",
    },
  );

export const closureInputSchema = z
  .object({
    barberId: z.uuid().nullable(),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    fullDay: z.boolean(),
    startTime: wallClockTimeSchema.nullable(),
    endTime: wallClockTimeSchema.nullable(),
    reason: z.string().trim().max(200).nullable(),
  })
  .refine((input) => input.startDate <= input.endDate, { message: "End date before start date" })
  .refine(
    (input) =>
      input.fullDay
        ? true
        : input.startTime !== null && input.endTime !== null && input.startTime < input.endTime,
    {
      message: "Partial closures need a start and end time",
    },
  );

export const shopProfileInputSchema = z.object({
  name: z.string().trim().min(1).max(160),
  shortName: z.string().trim().max(60).optional(),
  tagline: z.string().trim().max(200).optional(),
  description: z.string().trim().max(2000).optional(),
  contact: z
    .object({
      phone: z.string().trim().min(3).max(32),
      email: z.email().max(255).optional(),
      whatsapp: z.string().trim().max(32).optional(),
      website: z.url().max(255).optional(),
    })
    .optional(),
  location: z
    .object({
      addressLine: z.string().trim().min(1).max(255),
      city: z.string().trim().min(1).max(120),
      province: z.string().trim().max(120).optional(),
      country: z.string().trim().min(1).max(120),
      postalCode: z.string().trim().max(20).optional(),
      mapsUrl: z.url().max(500).optional(),
    })
    .optional(),
  social: z
    .object({
      facebook: z.url().max(255).optional(),
      instagram: z.url().max(255).optional(),
      tiktok: z.url().max(255).optional(),
      twitter: z.url().max(255).optional(),
      youtube: z.url().max(255).optional(),
    })
    .optional(),
});

export { bookingRulesSchema };
