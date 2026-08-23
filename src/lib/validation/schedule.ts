import { z } from "zod";

/**
 * Wall-clock time strings ("09:00", "14:30") interpreted in the
 * shop timezone. Never converted or stored as instants here.
 */

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const wallClockTimeSchema = z
  .string()
  .regex(TIME_PATTERN, "Expected HH:mm in 24 hour format");

export const workingIntervalSchema = z
  .object({
    start: wallClockTimeSchema,
    end: wallClockTimeSchema,
  })
  .refine((interval) => interval.start < interval.end, {
    message: "Interval end must be after interval start",
  });

export type WorkingInterval = z.infer<typeof workingIntervalSchema>;

/** Weekday numbers follow Date.getUTCDay(): 0 Sunday through 6 Saturday. */
export const WEEKDAY_MIN = 0;
export const WEEKDAY_MAX = 6;

export const weekdaySchema = z.number().int().min(WEEKDAY_MIN).max(WEEKDAY_MAX);

export const dayScheduleSchema = z.object({
  weekday: weekdaySchema,
  intervals: z.array(workingIntervalSchema).min(1),
});
