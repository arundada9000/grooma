import { addDaysToDateKey, compareDateKeys, epochToZonedParts } from "./format";

/**
 * Booking rule checks. All inputs are epoch milliseconds except the
 * advance window which compares calendar days in the shop zone so a
 * "30 days ahead" rule means exactly what an owner expects.
 */

export interface RuleCheck {
  ok: boolean;
  reason?: "PAST" | "MIN_NOTICE" | "MAX_ADVANCE";
}

export function checkNoticeAndWindow(
  startMs: number,
  nowMs: number,
  rules: { minNoticeMinutes: number; maxAdvanceDays: number },
  zone: string,
): RuleCheck {
  if (startMs < nowMs) {
    return { ok: false, reason: "PAST" };
  }
  if (startMs - nowMs < rules.minNoticeMinutes * 60_000) {
    return { ok: false, reason: "MIN_NOTICE" };
  }
  const todayKey = epochToZonedParts(zone, nowMs).dateKey;
  const maxKey = addDaysToDateKey(todayKey, rules.maxAdvanceDays);
  const slotKey = epochToZonedParts(zone, startMs).dateKey;
  if (compareDateKeys(slotKey, maxKey) > 0) {
    return { ok: false, reason: "MAX_ADVANCE" };
  }
  return { ok: true };
}

export function isBeforeCancelDeadline(
  appointmentStartMs: number,
  nowMs: number,
  cancelDeadlineMinutes: number,
): boolean {
  return appointmentStartMs - nowMs >= cancelDeadlineMinutes * 60_000;
}

export function isBeforeRescheduleDeadline(
  appointmentStartMs: number,
  nowMs: number,
  rescheduleDeadlineMinutes: number,
): boolean {
  return appointmentStartMs - nowMs >= rescheduleDeadlineMinutes * 60_000;
}
