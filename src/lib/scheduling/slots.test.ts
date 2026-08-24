import { describe, expect, it } from "vitest";
import { blockerAtMinute, footprintFits, generateSlotStarts } from "./slots";

describe("slot generation", () => {
  it("aligns starts on a global grid inside each window", () => {
    const windows = [
      { start: 540, end: 600 },
      { start: 610, end: 700 },
    ];
    // 15 minute grid: window one starts aligned, window two snaps to 615.
    expect(generateSlotStarts(windows, 15)).toEqual([
      540, 555, 570, 585, 615, 630, 645, 660, 675, 690,
    ]);
  });

  it("handles odd intervals and unaligned windows", () => {
    // Grid keeps stepping while the start minute is inside the window;
    // footprint fitting happens later.
    expect(generateSlotStarts([{ start: 541, end: 601 }], 20)).toEqual([560, 580, 600]);
    expect(generateSlotStarts([], 15)).toEqual([]);
  });

  it("requires duration plus buffer to fit before close", () => {
    const window = [{ start: 1020, end: 1080 }]; // 17:00 to 18:00
    // Spec example: closes at 18:00, 45 minute service.
    expect(footprintFits(window, { durationMinutes: 45, bufferMinutes: 0 }, 1020)).toBe(true);
    expect(footprintFits(window, { durationMinutes: 45, bufferMinutes: 0 }, 1050)).toBe(false); // 17:30 + 45 > 18:00
    expect(footprintFits(window, { durationMinutes: 45, bufferMinutes: 0 }, 1035)).toBe(true); // exactly 18:00
  });

  it("counts trailing buffer as part of the footprint", () => {
    const window = [{ start: 540, end: 600 }];
    expect(footprintFits(window, { durationMinutes: 30, bufferMinutes: 30 }, 540)).toBe(true);
    expect(footprintFits(window, { durationMinutes: 31, bufferMinutes: 30 }, 540)).toBe(false);
    // A start that fits duration but not the cleanup tail is rejected.
    expect(footprintFits(window, { durationMinutes: 30, bufferMinutes: 1 }, 570)).toBe(false);
  });

  it("rejects footprints split across a gap between windows", () => {
    const windows = [
      { start: 540, end: 600 },
      { start: 660, end: 720 },
    ];
    // 09:45 plus 30 minutes lands inside the gap; not bookable.
    expect(footprintFits(windows, { durationMinutes: 30, bufferMinutes: 0 }, 585)).toBe(false);
    expect(footprintFits(windows, { durationMinutes: 15, bufferMinutes: 0 }, 585)).toBe(true);
  });

  it("classifies blockers with closure over break over booked priority", () => {
    const working = [{ start: 540, end: 1080 }];
    const breaks = [{ start: 780, end: 840 }];
    const closures = [{ start: 540, end: 560 }];
    const busy = [{ start: 900, end: 960 }];

    expect(blockerAtMinute([], [], [], [], 600)).toBe("OUTSIDE_HOURS");
    expect(blockerAtMinute(working, breaks, closures, busy, 550)).toBe("CLOSURE");
    expect(blockerAtMinute(working, breaks, closures, busy, 800)).toBe("BREAK");
    expect(blockerAtMinute(working, breaks, closures, busy, 930)).toBe("BOOKED");
    expect(blockerAtMinute(working, breaks, closures, busy, 1000)).toBeNull();
  });
});
