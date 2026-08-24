import { describe, expect, it } from "vitest";
import { getAvailability, barbersForExactSlot } from "./availability";
import { wallTimeToEpochMs } from "./format";
import type { AvailabilityInput, BusyRange } from "./types";

/**
 * Integration matrix mirroring spec section 74: normal availability,
 * overlaps, boundaries, duration and buffer, breaks, closures, hours,
 * multiple intervals, notice limits, advance window, deadlines live in
 * rules.test.ts, multiple barbers, any barber assignment, timezone
 * boundaries. Concurrency is proven at the database level in phase 7.
 */

const KTM = "Asia/Kathmandu";

function base(overrides: Partial<AvailabilityInput> = {}): AvailabilityInput {
  return {
    zone: KTM,
    dateKeys: ["2026-08-24"], // Monday
    nowMs: wallTimeToEpochMs(KTM, "2026-08-24", "08:00"),
    service: { durationMinutes: 30, bufferMinutes: 0 },
    rules: { slotIntervalMinutes: 15, minNoticeMinutes: 0, maxAdvanceDays: 30 },
    barberIds: ["rama"],
    shopHours: [{ barberId: null, weekday: 1, intervals: [{ start: "09:00", end: "12:00" }] }],
    barberHours: {},
    breaks: [],
    closures: [],
    busy: [],
    ...overrides,
  };
}

const ms = (dateKey: string, time: string) => wallTimeToEpochMs(KTM, dateKey, time);
const times = (slots: { startMs: number }[]) => slots.map((s) => s.startMs);

describe("availability engine", () => {
  it("generates a normal grid across open hours", () => {
    const slots = getAvailability(base());
    // Starts whose footprint no longer fits stay visible but disabled
    // so the UI can explain why the tail of the day is greyed out.
    expect(times(slots)).toEqual([
      ms("2026-08-24", "09:00"),
      ms("2026-08-24", "09:15"),
      ms("2026-08-24", "09:30"),
      ms("2026-08-24", "09:45"),
      ms("2026-08-24", "10:00"),
      ms("2026-08-24", "10:15"),
      ms("2026-08-24", "10:30"),
      ms("2026-08-24", "10:45"),
      ms("2026-08-24", "11:00"),
      ms("2026-08-24", "11:15"),
      ms("2026-08-24", "11:30"),
      ms("2026-08-24", "11:45"),
    ]);
    const bookable = slots.filter((s) => s.available);
    expect(bookable.length).toBe(11); // 11:45 cannot finish by close
    expect(slots[11].reason).toBe("NO_BARBER");
    expect(slots.slice(0, 11).every((s) => s.barberIds.length === 1)).toBe(true);
  });

  it("respects the closing boundary exactly like the spec example", () => {
    const slots = getAvailability(
      base({
        shopHours: [{ barberId: null, weekday: 1, intervals: [{ start: "17:00", end: "18:00" }] }],
        service: { durationMinutes: 45, bufferMinutes: 0 },
        rules: { slotIntervalMinutes: 15, minNoticeMinutes: 0, maxAdvanceDays: 1 },
      }),
    );
    const byTime = new Map(slots.map((s) => [s.startMs, s]));
    expect(byTime.get(ms("2026-08-24", "17:00"))?.available).toBe(true);
    expect(byTime.get(ms("2026-08-24", "17:15"))?.available).toBe(true);
    // Too late to fit 45 minutes before 18:00: rendered disabled.
    expect(byTime.get(ms("2026-08-24", "17:30"))?.available).toBe(false);
    expect(byTime.get(ms("2026-08-24", "17:45"))?.available).toBe(false);
  });

  it("marks booked slots with reasons while keeping them visible", () => {
    const slots = getAvailability(
      base({
        busy: [
          {
            barberId: "rama",
            startMs: ms("2026-08-24", "10:00"),
            endMs: ms("2026-08-24", "10:45"),
          },
        ],
      }),
    );
    const byTime = new Map(slots.map((s) => [s.startMs, s]));
    expect(byTime.get(ms("2026-08-24", "09:30"))?.available).toBe(true); // ends exactly when busy starts
    expect(byTime.get(ms("2026-08-24", "09:45"))?.available).toBe(false); // would run into the booking
    expect(byTime.get(ms("2026-08-24", "10:15"))?.reason).toBe("BOOKED");
    expect(byTime.get(ms("2026-08-24", "10:45"))?.available).toBe(true); // adjacent start is fine
  });

  it("treats buffers as blocking tail time for later bookings", () => {
    const slots = getAvailability(
      base({
        service: { durationMinutes: 30, bufferMinutes: 15 },
        busy: [
          {
            barberId: "rama",
            startMs: ms("2026-08-24", "10:00"),
            endMs: ms("2026-08-24", "10:30"),
          },
        ],
      }),
    );
    const byTime = new Map(slots.map((s) => [s.startMs, s]));
    // 09:15 finishes at 09:45 plus cleanup; next clean start is 10:30.
    expect(byTime.get(ms("2026-08-24", "09:15"))?.available).toBe(true);
    expect(byTime.get(ms("2026-08-24", "09:30"))?.available).toBe(false);
    expect(byTime.get(ms("2026-08-24", "10:30"))?.available).toBe(true);
  });

  it("reports break and closure blockers distinctly", () => {
    const slots = getAvailability(
      base({
        shopHours: [
          { barberId: null, weekday: 1, intervals: [{ start: "09:00", end: "13:00" }] },
          { barberId: null, weekday: 2, intervals: [{ start: "09:00", end: "13:00" }] },
        ],
        dateKeys: ["2026-08-24", "2026-08-25"],
        breaks: [
          {
            barberId: null,
            kind: "RECURRING",
            weekday: 1,
            oneOffDate: null,
            startTime: "10:00",
            endTime: "10:30",
          },
        ],
        closures: [
          {
            barberId: null,
            startDate: "2026-08-25",
            endDate: "2026-08-25",
            fullDay: true,
            startTime: null,
            endTime: null,
          },
        ],
      }),
    );
    const byTime = new Map(slots.map((s) => [s.startMs, s]));
    expect(byTime.get(ms("2026-08-24", "09:30"))?.available).toBe(true);
    expect(byTime.get(ms("2026-08-24", "10:00"))?.reason).toBe("BREAK");
    expect(byTime.get(ms("2026-08-24", "10:15"))?.reason).toBe("BREAK");
    expect(byTime.get(ms("2026-08-24", "10:30"))?.available).toBe(true);
    // Full day closure keeps the day on the grid, fully disabled with
    // an explicit reason instead of a mysterious hole.
    const day2 = slots.filter((s) => s.startMs >= ms("2026-08-25", "00:00"));
    expect(day2.length).toBeGreaterThan(0);
    expect(day2.every((s) => !s.available && s.reason === "CLOSURE")).toBe(true);
  });

  it("applies partial closures only inside their window", () => {
    const slots = getAvailability(
      base({
        shopHours: [{ barberId: null, weekday: 1, intervals: [{ start: "09:00", end: "13:00" }] }],
        closures: [
          {
            barberId: null,
            startDate: "2026-08-24",
            endDate: "2026-08-24",
            fullDay: false,
            startTime: "10:00",
            endTime: "11:00",
          },
        ],
      }),
    );
    const byTime = new Map(slots.map((s) => [s.startMs, s]));
    expect(byTime.get(ms("2026-08-24", "09:30"))?.available).toBe(true);
    expect(byTime.get(ms("2026-08-24", "09:45"))?.available).toBe(false); // runs into closure
    expect(byTime.get(ms("2026-08-24", "10:00"))?.reason).toBe("CLOSURE");
    expect(byTime.get(ms("2026-08-24", "11:00"))?.available).toBe(true);
  });

  it("applies minimum notice to early slots only", () => {
    const slots = getAvailability(
      base({ rules: { slotIntervalMinutes: 15, minNoticeMinutes: 90, maxAdvanceDays: 7 } }),
    );
    const byTime = new Map(slots.map((s) => [s.startMs, s]));
    expect(byTime.get(ms("2026-08-24", "09:00"))?.reason).toBe("MIN_NOTICE");
    expect(byTime.get(ms("2026-08-24", "09:30"))?.available).toBe(true); // exactly 90 minutes out
  });

  it("hides days beyond the advance window but keeps the last day", () => {
    const slots = getAvailability(
      base({
        rules: { slotIntervalMinutes: 60, minNoticeMinutes: 0, maxAdvanceDays: 3 },
        dateKeys: ["2026-08-26", "2026-08-27", "2026-08-28"],
        shopHours: [
          { barberId: null, weekday: 3, intervals: [{ start: "09:00", end: "10:00" }] },
          { barberId: null, weekday: 4, intervals: [{ start: "09:00", end: "10:00" }] },
          { barberId: null, weekday: 5, intervals: [{ start: "09:00", end: "10:00" }] },
        ],
      }),
    );
    const available = times(slots.filter((s) => s.available));
    expect(available).toEqual([ms("2026-08-26", "09:00"), ms("2026-08-27", "09:00")]);
    // Day 31 still renders, flagged out of range.
    const tooFar = slots.find((s) => s.startMs === ms("2026-08-28", "09:00"));
    expect(tooFar?.available).toBe(false);
    expect(tooFar?.reason).toBe("MAX_ADVANCE");
  });

  it("unions multiple barbers with different schedules", () => {
    const input = base({
      barberIds: ["rama", "hari"],
      shopHours: [{ barberId: null, weekday: 1, intervals: [{ start: "09:00", end: "12:00" }] }],
      barberHours: {
        hari: [{ barberId: "hari", weekday: 1, intervals: [{ start: "10:30", end: "13:00" }] }],
      },
    });
    const slots = getAvailability(input);
    const byTime = new Map(slots.map((s) => [s.startMs, s]));
    expect(byTime.get(ms("2026-08-24", "09:15"))?.barberIds).toEqual(["rama"]);
    expect(byTime.get(ms("2026-08-24", "11:45"))?.barberIds).toEqual(["hari"]);
    expect(byTime.get(ms("2026-08-24", "10:30"))?.barberIds).toEqual(["rama", "hari"]);
  });

  it("supports any barber selection through per slot barber ids", () => {
    const slots = getAvailability(
      base({
        barberIds: ["rama", "hari", "bikash"],
        busy: [
          {
            barberId: "rama",
            startMs: ms("2026-08-24", "10:00"),
            endMs: ms("2026-08-24", "10:30"),
          },
        ],
      }),
    );
    const byTime = new Map(slots.map((s) => [s.startMs, s]));
    const ten = byTime.get(ms("2026-08-24", "10:00"));
    expect(ten?.available).toBe(true);
    expect(ten?.barberIds).toEqual(["hari", "bikash"]);
  });

  it("blocks the morning after an appointment crosses midnight", () => {
    const slots = getAvailability(
      base({
        shopHours: [{ barberId: null, weekday: 2, intervals: [{ start: "08:00", end: "10:00" }] }],
        dateKeys: ["2026-08-25"],
        service: { durationMinutes: 30, bufferMinutes: 0 },
        busy: [
          {
            barberId: "rama",
            startMs: ms("2026-08-24", "23:50"),
            endMs: ms("2026-08-25", "08:20"),
            status: "CONFIRMED",
          },
        ],
      }),
    );
    const byTime = new Map(slots.map((s) => [s.startMs, s]));
    expect(byTime.get(ms("2026-08-25", "08:00"))?.reason).toBe("BOOKED");
    expect(byTime.get(ms("2026-08-25", "08:30"))?.available).toBe(true);
  });

  it("ignores cancelled appointments", () => {
    const slots = getAvailability(
      base({
        busy: [
          {
            barberId: "rama",
            startMs: ms("2026-08-24", "10:00"),
            endMs: ms("2026-08-24", "10:30"),
            status: "CANCELLED",
          },
        ],
      }),
    );
    const ten = slots.find((s) => s.startMs === ms("2026-08-24", "10:00"));
    expect(ten?.available).toBe(true);
    expect(ten?.barberIds).toEqual(["rama"]);
  });

  it("keeps zone correctness on Kathmandu odd offsets", () => {
    // 09:00 NPT must equal 03:15 UTC in emitted epochs.
    const slots = getAvailability(base());
    expect(slots[0].startMs).toBe(Date.UTC(2026, 7, 24, 3, 15));
  });

  it("expands identical schedules safely across a DST jump", () => {
    const input = base({
      zone: "America/New_York",
      dateKeys: ["2026-03-07", "2026-03-09"],
      nowMs: wallTimeToEpochMs("America/New_York", "2026-03-06", "08:00"),
      shopHours: [
        { barberId: null, weekday: 6, intervals: [{ start: "09:00", end: "10:00" }] },
        { barberId: null, weekday: 1, intervals: [{ start: "09:00", end: "10:00" }] },
      ],
    });
    const slots = getAvailability(input);
    const divider = wallTimeToEpochMs("America/New_York", "2026-03-08", "00:00");
    const sat = slots.find((s) => s.startMs < divider);
    const mon = slots.find((s) => s.startMs > divider);
    // Same 09:00 wall time on both sides of the spring forward gap:
    // exactly 47 elapsed hours apart.
    expect(mon!.startMs - sat!.startMs).toBe(47 * 3600_000);
  });

  it("returns no capacity when nobody covers the footprint", () => {
    const probe = barbersForExactSlot(
      {
        zone: KTM,
        service: { durationMinutes: 120, bufferMinutes: 0 },
        barberIds: ["rama"],
        shopHours: [{ barberId: null, weekday: 1, intervals: [{ start: "09:00", end: "12:00" }] }],
        barberHours: {},
        breaks: [],
        closures: [],
      },
      "2026-08-24",
      ms("2026-08-24", "11:00"),
    );
    expect(probe).toEqual([]);
  });

  it("sees extra busy ranges passed by a transactional recheck", () => {
    const probeInput = {
      zone: KTM,
      service: { durationMinutes: 30, bufferMinutes: 0 },
      barberIds: ["rama"],
      shopHours: [{ barberId: null, weekday: 1, intervals: [{ start: "09:00", end: "12:00" }] }],
      barberHours: {},
      breaks: [],
      closures: [],
    };
    const before = barbersForExactSlot(probeInput, "2026-08-24", ms("2026-08-24", "10:00"));
    expect(before).toEqual(["rama"]);

    const racing: BusyRange[] = [
      { barberId: "rama", startMs: ms("2026-08-24", "10:00"), endMs: ms("2026-08-24", "10:30") },
    ];
    const after = barbersForExactSlot(probeInput, "2026-08-24", ms("2026-08-24", "10:00"), racing);
    expect(after).toEqual([]);
  });
});
