import { TZDate } from "@date-fns/tz";

/**
 * Zone safe conversions between wall clock strings ("09:30",
 * "2026-08-24"), zone aware calendar parts, and epoch milliseconds.
 * Every schedule interpretation funnels through here so DST oddities
 * are handled by the tz database exactly once.
 */

export function parseDateKey(dateKey: string): { year: number; monthIndex: number; day: number } {
  const [y, m, d] = dateKey.split("-").map(Number);
  if (
    !y ||
    !m ||
    !d ||
    m < 1 ||
    m > 12 ||
    d < 1 ||
    d > 31 ||
    !/^\d{4}-\d{2}-\d{2}$/.test(dateKey)
  ) {
    throw new Error(`Invalid date key: ${dateKey}`);
  }
  return { year: y, monthIndex: m - 1, day: d };
}

export function parseWallTime(time: string): { hours: number; minutes: number } {
  const [h, m] = time.split(":").map(Number);
  if (
    !Number.isInteger(h) ||
    !Number.isInteger(m) ||
    h < 0 ||
    h > 23 ||
    m < 0 ||
    m > 59 ||
    !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)
  ) {
    throw new Error(`Invalid wall time: ${time}`);
  }
  return { hours: h, minutes: m };
}

/** Epoch ms for HH:mm wall time on YYYY-MM-DD inside the given zone. */
export function wallTimeToEpochMs(zone: string, dateKey: string, time: string): number {
  const { year, monthIndex, day } = parseDateKey(dateKey);
  const { hours, minutes } = parseWallTime(time);
  return new TZDate(year, monthIndex, day, hours, minutes, 0, 0, zone).getTime();
}

export interface ZonedParts {
  dateKey: string;
  weekday: number;
  /** Minutes since zone midnight, 0 through 1439. */
  minuteOfDay: number;
}

/** Zone wall view of an instant. */
export function epochToZonedParts(zone: string, ms: number): ZonedParts {
  const z = new TZDate(ms, zone);
  const month = String(z.getMonth() + 1).padStart(2, "0");
  const day = String(z.getDate()).padStart(2, "0");
  return {
    dateKey: `${z.getFullYear()}-${month}-${day}`,
    weekday: z.getDay(),
    minuteOfDay: z.getHours() * 60 + z.getMinutes(),
  };
}

/** Epoch ms of zone midnight bounding ms from below. */
export function startOfZonedDayMs(zone: string, ms: number): number {
  const { dateKey } = epochToZonedParts(zone, ms);
  return wallTimeToEpochMs(zone, dateKey, "00:00");
}

/** Calendar shift on the date key itself, independent of any zone. */
export function addDaysToDateKey(dateKey: string, days: number): string {
  const { year, monthIndex, day } = parseDateKey(dateKey);
  const shifted = new Date(Date.UTC(year, monthIndex, day + days));
  return `${shifted.getUTCFullYear()}-${String(shifted.getUTCMonth() + 1).padStart(2, "0")}-${String(shifted.getUTCDate()).padStart(2, "0")}`;
}

export function weekdayOfDateKey(dateKey: string): number {
  const { year, monthIndex, day } = parseDateKey(dateKey);
  return new Date(Date.UTC(year, monthIndex, day)).getUTCDay();
}

/** YYYY-MM-DD comparison works lexicographically. */
export function compareDateKeys(a: string, b: string): -1 | 0 | 1 {
  return a === b ? 0 : a < b ? -1 : 1;
}

/** Formats minutes since midnight as HH:mm. */
export function minuteOfDayToHHMM(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * Current wall clock instant. Isolated so impure reads stay out of
 * component render bodies (React purity rules).
 */
export function currentInstantMs(): number {
  return Date.now();
}
