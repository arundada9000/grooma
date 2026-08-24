import { describe, expect, it } from "vitest";
import {
  breaksForDate,
  closuresForDate,
  freeWindowsForBarber,
  projectBusyToDaySegments,
  shopWindowsForWeekday,
  windowsForBarber,
} from "./hours";
import { wallTimeToEpochMs } from "./format";
import type { BreakRecord, BusyRange, ClosureRecord, WorkingHoursRecord } from "./types";

const KTM = "Asia/Kathmandu";

const shopHours: WorkingHoursRecord[] = [
  {
    barberId: null,
    weekday: 1,
    intervals: [
      { start: "09:00", end: "13:00" },
      { start: "14:00", end: "18:00" },
    ],
  },
];

const hariHours: WorkingHoursRecord[] = [
  { barberId: "hari", weekday: 1, intervals: [{ start: "11:00", end: "17:00" }] },
];

describe("hours expansion", () => {
  it("merges multiple intervals per weekday at shop level", () => {
    expect(shopWindowsForWeekday(shopHours, 1)).toEqual([
      { start: 540, end: 780 },
      { start: 840, end: 1080 },
    ]);
    expect(shopWindowsForWeekday(shopHours, 2)).toEqual([]);
  });

  it("lets barber hours replace shop hours for that day", () => {
    const input = { shopHours, barberHours: { hari: hariHours }, breaks: [], closures: [] };
    expect(windowsForBarber(input, "hari", 1)).toEqual([{ start: 660, end: 1020 }]);
    // A barber without own rows inherits the shop schedule.
    expect(windowsForBarber(input, "rama", 1)).toEqual([
      { start: 540, end: 780 },
      { start: 840, end: 1080 },
    ]);
  });

  it("cuts recurring and one off breaks in scope", () => {
    const breaks: BreakRecord[] = [
      // Shop lunch 13:30 to 14:30 straddles the midday gap and clips
      // the afternoon window head.
      {
        barberId: null,
        kind: "RECURRING",
        weekday: 1,
        oneOffDate: null,
        startTime: "13:30",
        endTime: "14:30",
      },
      // Hari personal block, one Monday only.
      {
        barberId: "hari",
        kind: "ONE_OFF",
        weekday: null,
        oneOffDate: "2026-08-24",
        startTime: "16:00",
        endTime: "17:00",
      },
    ];
    const input = { shopHours, barberHours: {}, breaks, closures: [] };

    expect(freeWindowsForBarber(input, "rama", "2026-08-24")).toEqual([
      { start: 540, end: 780 },
      { start: 870, end: 1080 },
    ]);
    // Hari inherits shop windows here; both cuts apply, leaving a tail
    // after the personal block through close.
    expect(freeWindowsForBarber(input, "hari", "2026-08-24")).toEqual([
      { start: 540, end: 780 },
      { start: 870, end: 960 },
      { start: 1020, end: 1080 },
    ]);
    // Neither break hits the following week for one offs; recurring does.
    expect(freeWindowsForBarber(input, "rama", "2026-08-31")).toEqual([
      { start: 540, end: 780 },
      { start: 870, end: 1080 },
    ]);
  });

  it("applies full day and partial closures per scope", () => {
    const closures: ClosureRecord[] = [
      {
        barberId: null,
        startDate: "2026-12-25",
        endDate: "2026-12-25",
        fullDay: true,
        startTime: null,
        endTime: null,
      },
      {
        barberId: "hari",
        startDate: "2026-08-24",
        endDate: "2026-08-24",
        fullDay: false,
        startTime: "15:00",
        endTime: "16:00",
      },
    ];
    const input = { shopHours, barberHours: {}, breaks: [], closures };

    // Shop closure wipes everyone on Christmas.
    expect(freeWindowsForBarber(input, "rama", "2026-12-25")).toEqual([]);
    expect(freeWindowsForBarber(input, "hari", "2026-12-25")).toEqual([]);
    // Barber scoped partial closure splits the afternoon.
    expect(freeWindowsForBarber(input, "hari", "2026-08-24")).toEqual([
      { start: 540, end: 780 },
      { start: 840, end: 900 },
      { start: 960, end: 1080 },
    ]);
    expect(closuresForDate(closures, null, "2026-08-24")).toEqual([]);
  });

  it("projects busy ranges onto days including midnight crossings", () => {
    const busy: BusyRange[] = [
      {
        barberId: "rama",
        startMs: wallTimeToEpochMs(KTM, "2026-08-24", "23:45"),
        endMs: wallTimeToEpochMs(KTM, "2026-08-25", "00:30"),
      },
    ];
    const byDay = projectBusyToDaySegments(KTM, busy);
    expect(byDay.get("2026-08-24")?.get("rama")).toEqual([{ start: 1425, end: 1440 }]);
    expect(byDay.get("2026-08-25")?.get("rama")).toEqual([{ start: 0, end: 30 }]);
  });

  it("skips cancelled and empty busy ranges", () => {
    const ms = wallTimeToEpochMs(KTM, "2026-08-24", "10:00");
    const byDay = projectBusyToDaySegments(KTM, [
      { barberId: "a", startMs: ms, endMs: ms + 3_600_000, status: "CANCELLED" },
      { barberId: "b", startMs: ms, endMs: ms },
    ]);
    expect(byDay.size).toBe(0);
  });

  it("scopes break lookups for shop wide queries", () => {
    const breaks: BreakRecord[] = [
      {
        barberId: null,
        kind: "RECURRING",
        weekday: 1,
        oneOffDate: null,
        startTime: "12:00",
        endTime: "12:30",
      },
      {
        barberId: "hari",
        kind: "RECURRING",
        weekday: 1,
        oneOffDate: null,
        startTime: "16:00",
        endTime: "16:15",
      },
    ];
    // Null target asks only for shop scoped rows.
    expect(breaksForDate(breaks, null, "2026-08-24")).toEqual([{ start: 720, end: 750 }]);
    expect(breaksForDate(breaks, "hari", "2026-08-24")).toEqual([
      { start: 720, end: 750 },
      { start: 960, end: 975 },
    ]);
  });
});
