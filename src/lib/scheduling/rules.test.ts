import { describe, expect, it } from "vitest";
import { checkNoticeAndWindow, isBeforeCancelDeadline, isBeforeRescheduleDeadline } from "./rules";
import { wallTimeToEpochMs } from "./format";

const KTM = "Asia/Kathmandu";

describe("booking rules", () => {
  const rules = { minNoticeMinutes: 120, maxAdvanceDays: 30 };

  it("rejects past starts as PAST", () => {
    const past = wallTimeToEpochMs(KTM, "2026-08-24", "09:00");
    const now = past + 60_000;
    expect(checkNoticeAndWindow(past, now, rules, KTM)).toEqual({ ok: false, reason: "PAST" });
  });

  it("enforces minimum notice with exact boundary allowed", () => {
    const start = wallTimeToEpochMs(KTM, "2026-08-25", "12:00");
    const justUnder = start - (2 * 60 - 1) * 60_000;
    const exact = start - 2 * 60 * 60_000;
    expect(checkNoticeAndWindow(start, justUnder, rules, KTM).reason).toBe("MIN_NOTICE");
    expect(checkNoticeAndWindow(start, exact, rules, KTM).ok).toBe(true);
  });

  it("blocks beyond max advance days inclusive of the last day", () => {
    const now = wallTimeToEpochMs(KTM, "2026-08-24", "10:00");
    const lastDay = wallTimeToEpochMs(KTM, "2026-09-23", "23:59"); // today + 30
    const tooFar = wallTimeToEpochMs(KTM, "2026-09-24", "09:00"); // day 31
    expect(checkNoticeAndWindow(lastDay, now, rules, KTM).ok).toBe(true);
    expect(checkNoticeAndWindow(tooFar, now, rules, KTM)).toEqual({
      ok: false,
      reason: "MAX_ADVANCE",
    });
  });

  it("checks cancel and reschedule deadlines independently", () => {
    const start = wallTimeToEpochMs(KTM, "2026-08-25", "12:00");
    const threeHoursBefore = start - 3 * 3600_000;
    const ninetyMinutesBefore = start - 90 * 60_000;

    expect(isBeforeCancelDeadline(start, threeHoursBefore, 120)).toBe(true);
    expect(isBeforeCancelDeadline(start, ninetyMinutesBefore, 120)).toBe(false);
    expect(isBeforeRescheduleDeadline(start, ninetyMinutesBefore, 90)).toBe(true);
    expect(isBeforeRescheduleDeadline(start, ninetyMinutesBefore, 91)).toBe(false);
  });
});
