import { z } from "zod";
import { wallClockTimeSchema } from "./schedule";

/**
 * Public booking boundary schemas. Everything the customer controls
 * passes through here before any database or engine code runs.
 */

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const dateKeySchema = z
  .string()
  .regex(DATE_PATTERN, "Expected YYYY-MM-DD")
  .refine((value) => !Number.isNaN(Date.parse(`${value}T00:00Z`)), "Invalid calendar date");

/** The customer either picks a barber or lets the shop assign one. */
export const barberSelectionSchema = z.union([z.uuid(), z.literal("ANY")]);

export const availabilityQuerySchema = z.object({
  serviceId: z.uuid(),
  barberId: z.uuid().nullish(),
  /** One to seven consecutive shop zone days, newest last. */
  dateKeys: z.array(dateKeySchema).min(1).max(7),
});
export type AvailabilityQuery = z.infer<typeof availabilityQuerySchema>;

export const customerDetailsSchema = z.object({
  name: z.string().trim().min(2).max(160),
  phone: z
    .string()
    .trim()
    .regex(/^[+()\-\s\d]{6,32}$/, "Phone must be 6-32 digits with optional + ( ) - separators"),
  email: z.email().max(255).optional(),
});

export type CustomerDetails = z.infer<typeof customerDetailsSchema>;

export const createBookingSchema = z.object({
  serviceId: z.uuid(),
  barberId: barberSelectionSchema,
  dateKey: dateKeySchema,
  time: wallClockTimeSchema,
  customer: customerDetailsSchema,
  notes: z.string().trim().max(500).optional(),
});
export type CreateBookingInput = z.infer<typeof createBookingSchema>;

export const manageTokenSchema = z
  .string()
  .regex(/^[A-Za-z0-9_-]{20,100}$/, "Malformed manage token");

export const cancelBookingSchema = z.object({
  token: manageTokenSchema,
  reason: z.string().trim().max(300).optional(),
});

export const rescheduleBookingSchema = z.object({
  token: manageTokenSchema,
  dateKey: dateKeySchema,
  time: wallClockTimeSchema,
});

export type CancelBookingInput = z.infer<typeof cancelBookingSchema>;
export type RescheduleBookingInput = z.infer<typeof rescheduleBookingSchema>;
