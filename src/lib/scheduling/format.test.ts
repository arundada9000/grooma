import { TZDate } from "@date-fns/tz";
import { describe, expect, it } from "vitest";
import {
  addDaysToDateKey,
  compareDateKeys,
  epochToZonedParts,
  minuteOfDayToHHMM,
  parseDateKey,
  wallTimeToEpochMs,
  weekdayOfDateKey,
} from "./format";

const KTM = "Asia/Kathmandu";
const NYC = "America/New_York";

describe("zone conversions", () => {
  it("interprets Kathmandu wall time at its fixed 05:45 offset", () => {
    // 2026-08-24 09:00 NPT == 03:15 UTC.
    expect(wallTimeToEpochMs(KTM, "2026-08-24", "09:00")).toBe(Date.UTC(2026, 7, 24, 3, 15));
  });

  it("round trips instants through zone parts", () => {
    const ms = wallTimeToEpochMs(KTM, "2026-08-24", "17:30");
    const parts = epochToZonedParts(KTM, ms);
    expect(parts.dateKey).toBe("2026-08-24");
    expect(parts.minuteOfDay).toBe(17 * 60 + 30);
    // Monday per Date.getDay().
    expect(parts.weekday).toBe(1);
  });

  it("handles eastern hemisphere day ahead of UTC", () => {
    // 2026-01-01 00:30 NPT is still 2025-12-31 in UTC.
    const ms = wallTimeToEpochMs(KTM, "2026-01-01", "00:30");
    expect(new Date(ms).toISOString()).toBe("2025-12-31T18:45:00.000Z");
    expect(epochToZonedParts(KTM, ms).dateKey).toBe("2026-01-01");
  });

  it("resolves spring forward wall times without throwing", () => {
    // 02:30 does not exist on 2026-03-08 in New York; the tz database
    // skips it forward to an equivalent valid instant.
    const ms = new TZDate(2026, 2, 8, 2, 30, 0, 0, NYC).getTime();
    const minute = epochToZonedParts(NYC, ms).minuteOfDay;
    expect([150, 210]).toContain(minute);
  });

  it("spaces identical wall times around a DST jump by 47 hours", () => {
    const before = wallTimeToEpochMs(NYC, "2026-03-07", "09:00"); // EST, -5
    const after = wallTimeToEpochMs(NYC, "2026-03-09", "09:00"); // EDT, -4
    expect(after - before).toBe(47 * 3600_000);
  });

  it("shifts date keys across month and year boundaries", () => {
    expect(addDaysToDateKey("2026-08-31", 1)).toBe("2026-09-01");
    expect(addDaysToDateKey("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDaysToDateKey("2028-02-28", 1)).toBe("2028-02-29");
    expect(addDaysToDateKey("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("derives weekdays and orders keys lexicographically", () => {
    expect(weekdayOfDateKey("2026-08-23")).toBe(0); // Sunday
    expect(compareDateKeys("2026-08-24", "2026-09-01")).toBe(-1);
    expect(minuteOfDayToHHMM(555)).toBe("09:15");
    expect(parseDateKey("2026-08-24").monthIndex).toBe(7);
  });
});
