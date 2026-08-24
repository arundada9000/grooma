/**
 * Public result contract for the booking pipeline. Server actions never
 * throw domain errors at the client; they return discriminated results
 * whose codes drive the recovery UX (retry, pick another slot, pick
 * another barber, manage existing appointment).
 */

export type BookingErrorCode =
  | "INVALID_INPUT"
  | "RATE_LIMITED"
  | "SERVICE_NOT_FOUND"
  | "BARBER_NOT_FOUND"
  | "SLOT_UNAVAILABLE"
  | "RULE_VIOLATION"
  | "MAX_DAILY_REACHED"
  | "NOT_FOUND"
  | "DEADLINE_PASSED"
  | "STATE_CONFLICT";

export interface BookingFailure {
  ok: false;
  code: BookingErrorCode;
  /** Machine readable detail: which rule failed, which reason blocked. */
  detail?: string;
}

export type SlotBlockCode = Exclude<
  import("@/lib/scheduling/types").SlotBlockReason,
  "CLOSED" | "OUTSIDE_HOURS" | "BREAK" | "CLOSURE"
>;

/** Customer safe projection of an appointment; internal ids omitted. */
export interface AppointmentView {
  /** Historical snapshot; the UI resolves it against the active locale. */
  serviceName: import("@/i18n/localized-text").LocalizedText;
  barberName: string;
  startMs: number;
  endMs: number;
  status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
  priceCents: number;
  durationMinutes: number;
  customerNotes: string | null;
}

export type LookupResult = { ok: true; appointment: AppointmentView } | BookingFailure;

export type CreateBookingResult =
  { ok: true; appointment: AppointmentView; lookupToken: string } | BookingFailure;

export type MutationResult = { ok: true } | BookingFailure;
