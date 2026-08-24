import type { WorkingInterval } from "@/lib/validation/schedule";

/**
 * Pure scheduling types. The engine never touches the database; callers
 * assemble these inputs from repositories. All minute math happens on
 * wall-clock ranges [start, end) inside the shop timezone, while busy
 * periods arrive as epoch milliseconds and are projected onto days.
 */

export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type BreakKind = "RECURRING" | "ONE_OFF";

/** Rows shaped like the working_hours table, shop or barber scope. */
export interface WorkingHoursRecord {
  barberId: string | null;
  /** 0 Sunday through 6 Saturday, matches Date.getDay(). */
  weekday: number;
  intervals: WorkingInterval[];
}

/** Rows shaped like the breaks table, shop or barber scope. */
export interface BreakRecord {
  barberId: string | null;
  kind: BreakKind;
  /** Set for recurring weekly breaks. */
  weekday: number | null;
  /** Set for one-off breaks, YYYY-MM-DD in the shop timezone. */
  oneOffDate: string | null;
  startTime: string;
  endTime: string;
}

/** Rows shaped like the closures table, shop or barber scope. */
export interface ClosureRecord {
  barberId: string | null;
  /** YYYY-MM-DD inclusive in the shop timezone. */
  startDate: string;
  endDate: string;
  fullDay: boolean;
  startTime: string | null;
  endTime: string | null;
}

/**
 * Blocking time derived from appointments. Callers must pass only ranges
 * that should block slots (PENDING or CONFIRMED); cancelled rows are
 * skipped defensively anyway.
 */
export interface BusyRange {
  barberId: string;
  startMs: number;
  endMs: number;
  status?: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
}

/** The timing slice of a service the engine needs. */
export interface ServiceTiming {
  durationMinutes: number;
  bufferMinutes: number;
}

/** The booking rules slice the slot grid and notice checks need. */
export interface SchedulingRules {
  slotIntervalMinutes: number;
  minNoticeMinutes: number;
  maxAdvanceDays: number;
}

/** Why a candidate start cannot be booked right now. */
export type SlotBlockReason =
  /** The whole day is closed for every eligible barber. */
  | "CLOSED"
  /** The start lands outside working hours after cuts. */
  | "OUTSIDE_HOURS"
  /** Inside a break window. */
  | "BREAK"
  /** Inside a closure window. */
  | "CLOSURE"
  /** Another appointment occupies the barber footprint. */
  | "BOOKED"
  /** No eligible barber can cover the whole service. */
  | "NO_BARBER"
  /** Start is before now. */
  | "PAST"
  /** Start violates the minimum notice period. */
  | "MIN_NOTICE"
  /** Start is beyond the maximum advance window. */
  | "MAX_ADVANCE";

export interface Slot {
  /** Shop zone calendar day this start belongs to. */
  dateKey: string;
  /** Minute of day [0, 1440) of the start in the shop zone. */
  startMinute: number;
  /** Epoch milliseconds of the service start. */
  startMs: number;
  /** Epoch milliseconds of the customer visible end (no buffer). */
  endMs: number;
  available: boolean;
  /** Barbers that could take this exact start. Empty when unavailable. */
  barberIds: string[];
  /** Present only when available is false. */
  reason?: SlotBlockReason;
}

export interface AvailabilityInput {
  /** IANA zone, e.g. "Asia/Kathmandu". All wall-clock strings use it. */
  zone: string;
  /**
   * Days to generate slots for, each "YYYY-MM-DD" interpreted in the
   * shop zone. Sorted output spans all provided days.
   */
  dateKeys: string[];
  /** Current time as epoch milliseconds; drives notice and past checks. */
  nowMs: number;
  service: ServiceTiming;
  rules: SchedulingRules;
  /** Eligible barbers for this service, any of which may take it. */
  barberIds: string[];
  /** Shop level hours (barberId null). Required fallback. */
  shopHours: WorkingHoursRecord[];
  /** Per barber hour overrides keyed by barber id. */
  barberHours: Record<string, WorkingHoursRecord[]>;
  breaks: BreakRecord[];
  closures: ClosureRecord[];
  busy: BusyRange[];
}
