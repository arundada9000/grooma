import type { MinuteRange } from "./interval";
import { containedInAny } from "./interval";
import type { ServiceTiming, SlotBlockReason } from "./types";

/**
 * Candidate slot generation. Starts sit on a global grid (minute of day
 * divisible by the interval) so the same times appear every day,
 * matching what a picker UI shows.
 */

export function generateSlotStarts(windows: MinuteRange[], slotIntervalMinutes: number): number[] {
  const starts: number[] = [];
  for (const window of windows) {
    const first =
      window.start +
      ((slotIntervalMinutes - (window.start % slotIntervalMinutes)) % slotIntervalMinutes);
    for (let start = first; start < window.end; start += slotIntervalMinutes) {
      starts.push(start);
    }
  }
  return starts;
}

/**
 * True when the full service footprint (duration plus trailing buffer)
 * fits inside one continuous free window. A slot that would be split by
 * a break gap is not bookable even though its start looks free.
 */
export function footprintFits(
  windows: MinuteRange[],
  service: ServiceTiming,
  startMinute: number,
): boolean {
  const footprint: MinuteRange = {
    start: startMinute,
    end: startMinute + service.durationMinutes + service.bufferMinutes,
  };
  return containedInAny(windows, footprint);
}

/** Classifies why a minute inside working hours cannot host a service. */
export function blockerAtMinute(
  workingWindows: MinuteRange[],
  breakCuts: MinuteRange[],
  closureCuts: MinuteRange[],
  busyCuts: MinuteRange[],
  minute: number,
): SlotBlockReason | null {
  if (!workingWindows.some((w) => w.start <= minute && minute < w.end)) {
    return "OUTSIDE_HOURS";
  }
  if (closureCuts.some((c) => c.start <= minute && minute < c.end)) return "CLOSURE";
  if (breakCuts.some((c) => c.start <= minute && minute < c.end)) return "BREAK";
  if (busyCuts.some((c) => c.start <= minute && minute < c.end)) return "BOOKED";
  return null;
}
