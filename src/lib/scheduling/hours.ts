import type { BreakRecord, BusyRange, ClosureRecord, WorkingHoursRecord } from "./types";
import {
  addDaysToDateKey,
  compareDateKeys,
  epochToZonedParts,
  parseWallTime,
  wallTimeToEpochMs,
  weekdayOfDateKey,
} from "./format";
import { mergeRanges, subtractRanges, type MinuteRange } from "./interval";

/**
 * Expands wall-clock schedules into concrete open windows for one
 * calendar day inside the shop timezone, then removes breaks and
 * closures. Barber level hours replace shop level hours when present.
 */

/** Merged shop level windows for a weekday, empty when closed that day. */
export function shopWindowsForWeekday(
  shopHours: WorkingHoursRecord[],
  weekday: number,
): MinuteRange[] {
  return toMinuteRanges(
    shopHours.filter((row) => row.barberId === null && row.weekday === weekday),
  );
}

/**
 * Windows for one barber on a weekday: barber rows win outright when the
 * barber has any for that day, otherwise the shop schedule applies.
 */
export function windowsForBarber(
  input: Pick<AvailabilityHoursInput, "shopHours" | "barberHours">,
  barberId: string,
  weekday: number,
): MinuteRange[] {
  const own = (input.barberHours[barberId] ?? []).filter((row) => row.weekday === weekday);
  if (own.length > 0) {
    return toMinuteRanges(own);
  }
  return shopWindowsForWeekday(input.shopHours, weekday);
}

export interface AvailabilityHoursInput {
  shopHours: WorkingHoursRecord[];
  barberHours: Record<string, WorkingHoursRecord[]>;
  breaks: BreakRecord[];
  closures: ClosureRecord[];
}

function toMinuteRanges(rows: WorkingHoursRecord[]): MinuteRange[] {
  return mergeRanges(
    rows.flatMap((row) =>
      row.intervals.map((interval) => ({
        start: minutesOfWallTime(interval.start),
        end: minutesOfWallTime(interval.end),
      })),
    ),
  );
}

function minutesOfWallTime(time: string): number {
  const { hours, minutes } = parseWallTime(time);
  return hours * 60 + minutes;
}

/** Recurring and one-off breaks hitting this date key. */
export function breaksForDate(
  breaks: BreakRecord[],
  barberId: string | null,
  dateKey: string,
): MinuteRange[] {
  const weekday = weekdayOfDateKey(dateKey);
  return mergeRanges(
    breaks
      .filter((b) => scopeMatches(b.barberId, barberId))
      .filter((b) =>
        b.kind === "RECURRING"
          ? b.weekday === weekday
          : b.oneOffDate !== null && b.oneOffDate === dateKey,
      )
      .map((b) => ({
        start: minutesOfWallTime(b.startTime),
        end: minutesOfWallTime(b.endTime),
      })),
  );
}

/**
 * Closures covering this date key for a scope. Full day closures return
 * one range covering every minute; partial closures use their window.
 */
export function closuresForDate(
  closures: ClosureRecord[],
  barberId: string | null,
  dateKey: string,
): MinuteRange[] {
  return closures
    .filter((c) => scopeMatches(c.barberId, barberId))
    .filter(
      (c) => compareDateKeys(c.startDate, dateKey) <= 0 && compareDateKeys(dateKey, c.endDate) <= 0,
    )
    .map((c) =>
      c.fullDay || !c.startTime || !c.endTime
        ? { start: 0, end: 24 * 60 }
        : {
            start: minutesOfWallTime(c.startTime),
            end: minutesOfWallTime(c.endTime),
          },
    );
}

function scopeMatches(rowScope: string | null, target: string | null): boolean {
  // A null row scope applies shop wide; a null target asks for shop
  // scoped rows only.
  if (target === null) return rowScope === null;
  return rowScope === null || rowScope === target;
}

/**
 * Free windows for one barber after breaks, closures, and any busy
 * appointment segments projected onto this day.
 */
export function freeWindowsForBarber(
  input: AvailabilityHoursInput,
  barberId: string,
  dateKey: string,
  busySegments?: MinuteRange[],
): MinuteRange[] {
  const weekday = weekdayOfDateKey(dateKey);
  const base = windowsForBarber(input, barberId, weekday);
  const cuts = [
    ...breaksForDate(input.breaks, barberId, dateKey),
    ...breaksForDate(input.breaks, null, dateKey),
    ...closuresForDate(input.closures, barberId, dateKey),
    ...closuresForDate(input.closures, null, dateKey),
    ...(busySegments ?? []),
  ];
  return subtractRanges(base, cuts);
}

/**
 * Projects epoch busy ranges onto calendar days in the zone. Ranges that
 * cross midnight contribute a tail segment [0, x) to the following day.
 * Returns a map of date key to merged busy minute ranges per barber.
 */
export function projectBusyToDaySegments(
  zone: string,
  busy: BusyRange[],
): Map<string, Map<string, MinuteRange[]>> {
  const byDay = new Map<string, Map<string, MinuteRange[]>>();
  for (const range of busy) {
    if (range.status === "CANCELLED") continue;
    if (range.endMs <= range.startMs) continue;
    let cursor = range.startMs;
    while (cursor < range.endMs) {
      const parts = epochToZonedParts(zone, cursor);
      const nextDayStart = wallTimeToEpochMs(zone, addDaysToDateKey(parts.dateKey, 1), "00:00");
      const segmentEnd = Math.min(range.endMs, nextDayStart);
      const endIsMidnight = segmentEnd === nextDayStart;
      const endMinute = endIsMidnight ? 24 * 60 : epochToZonedParts(zone, segmentEnd).minuteOfDay;

      let perBarber = byDay.get(parts.dateKey);
      if (!perBarber) {
        perBarber = new Map();
        byDay.set(parts.dateKey, perBarber);
      }
      const list = perBarber.get(range.barberId) ?? [];
      list.push({ start: parts.minuteOfDay, end: endMinute });
      perBarber.set(range.barberId, list);

      cursor = segmentEnd;
    }
  }
  for (const perBarber of byDay.values()) {
    for (const [barberId, list] of perBarber) {
      perBarber.set(barberId, mergeRanges(list));
    }
  }
  return byDay;
}
