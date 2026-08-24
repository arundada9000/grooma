import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import type { QueryExecutor } from "@/db/repositories/booking";
import {
  countActiveBookingsOnDay,
  findActiveService,
  findAppointmentByTokenHash,
  findEligibleBarbers,
  loadBreaks,
  loadBusyRanges,
  loadClosures,
  loadWorkingHours,
  upsertCustomer,
} from "@/db/repositories/booking";
import type { Shop } from "@/db/schema";
import { appointments } from "@/db/schema";
import { addDaysToDateKey, wallTimeToEpochMs } from "@/lib/scheduling/format";
import { barbersForExactSlot, getAvailability } from "@/lib/scheduling/availability";
import {
  checkNoticeAndWindow,
  isBeforeCancelDeadline,
  isBeforeRescheduleDeadline,
} from "@/lib/scheduling/rules";
import type { AvailabilityInput, Slot } from "@/lib/scheduling/types";
import type {
  AvailabilityQuery,
  CancelBookingInput,
  CreateBookingInput,
  RescheduleBookingInput,
} from "@/lib/validation/booking";
import { generateLookupToken, hashLookupToken } from "./token";
import type {
  AppointmentView,
  BookingFailure,
  CreateBookingResult,
  LookupResult,
  MutationMeta,
  MutationResult,
} from "./types";

/**
 * Booking pipeline core. Server actions validate input and rate limit,
 * then delegate here. Every mutation rechecks capacity inside its
 * transaction; the appointments_no_double_booking exclusion constraint
 * (AD-03) is the final arbiter, so the loser of a race receives Postgres
 * error 23P01 which maps to the SLOT_UNAVAILABLE recovery code.
 */

const PG_EXCLUSION_VIOLATION = "23P01";

/** Wide enough to catch busy ranges bleeding across midnight. */
const BUSY_MARGIN_HOURS = 36;

function exclusionFailure(detail: string): BookingFailure {
  return { ok: false, code: "SLOT_UNAVAILABLE", detail };
}

function isExclusionViolation(error: unknown): boolean {
  // Drizzle wraps driver errors; walk the cause chain for the code.
  let current: unknown = error;
  while (current != null) {
    if ((current as { code?: string }).code === PG_EXCLUSION_VIOLATION) return true;
    current = (current as { cause?: unknown }).cause;
  }
  return false;
}

function toView(row: typeof appointments.$inferSelect): AppointmentView {
  return {
    serviceName: row.serviceNameSnapshot,
    barberName: row.barberNameSnapshot,
    startMs: row.startTime.getTime(),
    endMs: row.endTime.getTime(),
    status: row.status,
    priceCents: row.priceAtBookingCents,
    durationMinutes: row.durationAtBookingMinutes,
    customerNotes: row.customerNotes,
  };
}

type AppointmentWithContact = typeof appointments.$inferSelect & {
  customerName?: string;
  customerEmail?: string | null;
};

/** Notification payload source; snapshot fields mirror the view. */
function mutationMeta(
  row: AppointmentWithContact,
  contact: { customerName: string; customerEmail: string | null },
): MutationMeta {
  const view = toView(row);
  return {
    appointmentId: row.id,
    customerName: contact.customerName ?? row.customerName ?? "",
    customerEmail: contact.customerEmail ?? row.customerEmail ?? null,
    serviceName: view.serviceName,
    barberName: view.barberName,
    startMs: view.startMs,
    endMs: view.endMs,
    priceCents: view.priceCents,
  };
}

interface ScheduleBundle {
  hoursInput: Pick<AvailabilityInput, "shopHours" | "barberHours" | "breaks" | "closures">;
  eligible: { id: string; displayName: string }[];
}

async function assembleSchedule(shop: Shop, serviceId: string): Promise<ScheduleBundle> {
  const [rows, breaks, closures] = await Promise.all([
    loadWorkingHours(shop.id),
    loadBreaks(shop.id),
    loadClosures(shop.id),
  ]);
  const eligible = await findEligibleBarbers(shop.id, serviceId);

  const barberHours: AvailabilityInput["barberHours"] = {};
  for (const row of rows) {
    if (row.barberId === null) continue;
    (barberHours[row.barberId] ??= []).push(row);
  }

  return { hoursInput: { shopHours: rows, barberHours, breaks, closures }, eligible };
}

function ruleFailure(startMs: number, nowMs: number, shop: Shop): BookingFailure | null {
  const verdict = checkNoticeAndWindow(startMs, nowMs, shop.bookingRules, shop.timezone);
  return verdict.ok ? null : { ok: false, code: "RULE_VIOLATION", detail: verdict.reason };
}

/** Busy ranges covering the day plus a margin for midnight crossings. */
async function busyAroundDay(exec: QueryExecutor, shop: Shop, dateKey: string) {
  const windowStart =
    wallTimeToEpochMs(shop.timezone, dateKey, "00:00") - BUSY_MARGIN_HOURS * 3_600_000;
  const windowEnd =
    wallTimeToEpochMs(shop.timezone, addDaysToDateKey(dateKey, 1), "00:00") +
    BUSY_MARGIN_HOURS * 3_600_000;
  return loadBusyRanges(exec, shop.id, windowStart, windowEnd);
}

export async function getAvailabilityCore(shop: Shop, query: AvailabilityQuery): Promise<Slot[]> {
  const service = await findActiveService(shop.id, query.serviceId);
  if (!service) return [];

  const schedule = await assembleSchedule(shop, query.serviceId);
  const barberIds = schedule.eligible
    .filter((barber) => query.barberId == null || barber.id === query.barberId)
    .map((barber) => barber.id);

  const sortedKeys = [...query.dateKeys].sort();
  const firstDayStart = wallTimeToEpochMs(shop.timezone, sortedKeys[0], "00:00");
  const lastDayEnd =
    wallTimeToEpochMs(
      shop.timezone,
      addDaysToDateKey(sortedKeys[sortedKeys.length - 1], 1),
      "00:00",
    ) +
    BUSY_MARGIN_HOURS * 3_600_000;

  return getAvailability({
    zone: shop.timezone,
    dateKeys: sortedKeys,
    nowMs: Date.now(),
    service: { durationMinutes: service.durationMinutes, bufferMinutes: service.bufferMinutes },
    rules: shop.bookingRules,
    barberIds,
    shopHours: schedule.hoursInput.shopHours,
    barberHours: schedule.hoursInput.barberHours,
    breaks: schedule.hoursInput.breaks,
    closures: schedule.hoursInput.closures,
    busy: await loadBusyRanges(db, shop.id, firstDayStart, lastDayEnd),
  });
}

export async function createBookingCore(
  shop: Shop,
  input: CreateBookingInput,
): Promise<CreateBookingResult> {
  const service = await findActiveService(shop.id, input.serviceId);
  if (!service) return { ok: false, code: "SERVICE_NOT_FOUND" };

  const schedule = await assembleSchedule(shop, input.serviceId);
  let candidates = schedule.eligible;
  if (input.barberId !== "ANY") {
    candidates = candidates.filter((barber) => barber.id === input.barberId);
  }
  if (candidates.length === 0) return { ok: false, code: "BARBER_NOT_FOUND" };

  const startMs = wallTimeToEpochMs(shop.timezone, input.dateKey, input.time);
  const endMs = startMs + service.durationMinutes * 60_000;
  const nowMs = Date.now();

  const earlyRuleFail = ruleFailure(startMs, nowMs, shop);
  if (earlyRuleFail) return earlyRuleFail;

  const probeBase = {
    zone: shop.timezone,
    service: { durationMinutes: service.durationMinutes, bufferMinutes: service.bufferMinutes },
    barberIds: candidates.map((barber) => barber.id),
    ...schedule.hoursInput,
  };

  try {
    const outcome = await db.transaction(async (tx) => {
      // The recheck reads through this transaction so it observes any
      // commit that raced ahead of us.
      const busy = await busyAroundDay(tx, shop, input.dateKey);
      const fitting = barbersForExactSlot(probeBase, input.dateKey, startMs, busy);
      if (fitting.length === 0) return { kind: "conflict" as const };

      const chosenId = input.barberId !== "ANY" ? input.barberId : fitting[0];
      const chosenName =
        candidates.find((barber) => barber.id === chosenId)?.displayName ?? "Barber";

      const customerId = await upsertCustomer(tx, shop.id, input.customer);

      const maxPerDay = shop.bookingRules.maxDailyBookingsPerCustomer;
      if (maxPerDay != null) {
        const dayStart = wallTimeToEpochMs(shop.timezone, input.dateKey, "00:00");
        const alreadyBooked = await countActiveBookingsOnDay(
          tx,
          customerId,
          dayStart,
          dayStart + 86_400_000,
        );
        if (alreadyBooked >= maxPerDay) return { kind: "limit" as const };
      }

      const lookupToken = generateLookupToken();
      const [row] = await tx
        .insert(appointments)
        .values({
          shopId: shop.id,
          customerId,
          barberId: chosenId,
          serviceId: service.id,
          startTime: new Date(startMs),
          endTime: new Date(endMs),
          status: "PENDING",
          source: "ONLINE",
          serviceNameSnapshot: service.name,
          barberNameSnapshot: chosenName,
          priceAtBookingCents: service.priceCents,
          durationAtBookingMinutes: service.durationMinutes,
          customerNotes: input.notes ?? null,
          lookupTokenHash: hashLookupToken(lookupToken),
        })
        .returning();

      return { kind: "created" as const, row, lookupToken };
    });

    switch (outcome.kind) {
      case "conflict":
        return exclusionFailure("The slot was just taken or cannot fit the service");
      case "limit":
        return { ok: false, code: "MAX_DAILY_REACHED" };
      case "created":
        return {
          ok: true,
          appointment: toView(outcome.row),
          lookupToken: outcome.lookupToken,
          meta: mutationMeta(outcome.row, {
            customerName: input.customer.name,
            customerEmail: input.customer.email ?? null,
          }),
        };
    }
  } catch (error) {
    if (isExclusionViolation(error)) {
      return exclusionFailure("Another booking won this slot");
    }
    throw error;
  }
}

export async function cancelByCustomerCore(
  shop: Shop,
  input: CancelBookingInput,
): Promise<MutationResult> {
  const appointment = await findAppointmentByTokenHash(hashLookupToken(input.token));
  if (!appointment || appointment.shopId !== shop.id) {
    return { ok: false, code: "NOT_FOUND" };
  }
  if (appointment.status !== "PENDING" && appointment.status !== "CONFIRMED") {
    return { ok: false, code: "STATE_CONFLICT" };
  }
  if (
    !isBeforeCancelDeadline(
      appointment.startTime.getTime(),
      Date.now(),
      shop.bookingRules.cancelDeadlineMinutes,
    )
  ) {
    return { ok: false, code: "DEADLINE_PASSED" };
  }

  await db
    .update(appointments)
    .set({ status: "CANCELLED", cancelReason: input.reason ?? null, updatedAt: new Date() })
    .where(eq(appointments.id, appointment.id));
  return {
    ok: true,
    meta: mutationMeta(appointment, appointment),
  };
}

export async function rescheduleByCustomerCore(
  shop: Shop,
  input: RescheduleBookingInput,
): Promise<LookupResult> {
  const appointment = await findAppointmentByTokenHash(hashLookupToken(input.token));
  if (!appointment || appointment.shopId !== shop.id) {
    return { ok: false, code: "NOT_FOUND" };
  }
  if (appointment.status !== "PENDING" && appointment.status !== "CONFIRMED") {
    return { ok: false, code: "STATE_CONFLICT" };
  }
  if (
    !isBeforeRescheduleDeadline(
      appointment.startTime.getTime(),
      Date.now(),
      shop.bookingRules.rescheduleDeadlineMinutes,
    )
  ) {
    return { ok: false, code: "DEADLINE_PASSED" };
  }

  const service = await findActiveService(shop.id, appointment.serviceId);
  if (!service) return { ok: false, code: "SERVICE_NOT_FOUND" };

  const schedule = await assembleSchedule(shop, service.id);
  const sameBarberEligible = schedule.eligible.some((barber) => barber.id === appointment.barberId);
  if (!sameBarberEligible) return { ok: false, code: "BARBER_NOT_FOUND" };

  const startMs = wallTimeToEpochMs(shop.timezone, input.dateKey, input.time);
  const endMs = startMs + service.durationMinutes * 60_000;

  const earlyRuleFail = ruleFailure(startMs, Date.now(), shop);
  if (earlyRuleFail) return earlyRuleFail;

  const probeBase = {
    zone: shop.timezone,
    service: { durationMinutes: service.durationMinutes, bufferMinutes: service.bufferMinutes },
    barberIds: [appointment.barberId],
    ...schedule.hoursInput,
  };

  try {
    const outcome = await db.transaction(async (tx) => {
      // Ignore the customer's own active appointment; it moves away.
      const busy = (await busyAroundDay(tx, shop, input.dateKey)).filter(
        (range) =>
          !(
            range.barberId === appointment.barberId &&
            range.startMs === appointment.startTime.getTime()
          ),
      );

      const fitting = barbersForExactSlot(probeBase, input.dateKey, startMs, busy);
      if (fitting.length === 0) return { kind: "conflict" as const };

      const [row] = await tx
        .update(appointments)
        .set({ startTime: new Date(startMs), endTime: new Date(endMs), updatedAt: new Date() })
        .where(eq(appointments.id, appointment.id))
        .returning();
      return { kind: "updated" as const, row };
    });

    if (outcome.kind === "conflict") {
      return exclusionFailure("The new time was just taken or cannot fit the service");
    }
    return {
      ok: true,
      appointment: toView(outcome.row),
      meta: mutationMeta(appointment, appointment),
    };
  } catch (error) {
    if (isExclusionViolation(error)) {
      return exclusionFailure("Another booking won this slot");
    }
    throw error;
  }
}

export async function lookupAppointmentCore(shop: Shop, token: string): Promise<LookupResult> {
  const appointment = await findAppointmentByTokenHash(hashLookupToken(token));
  if (!appointment || appointment.shopId !== shop.id) {
    return { ok: false, code: "NOT_FOUND" };
  }
  return {
    ok: true,
    appointment: toView(appointment),
    meta: mutationMeta(appointment, appointment),
  };
}

/**
 * Everything the manage page renders in one read: the customer safe
 * view plus the internal ids the reschedule slot picker needs and the
 * cancel deadline instant.
 */
export interface ManageModel {
  view: AppointmentView;
  serviceId: string;
  barberId: string;
  /** Epoch ms after which cancellation is blocked; null when no deadline. */
  cancelUntilMs: number | null;
}

export async function getManageModel(shop: Shop, token: string): Promise<ManageModel | null> {
  const appointment = await findAppointmentByTokenHash(hashLookupToken(token));
  if (!appointment || appointment.shopId !== shop.id) {
    return null;
  }
  const deadlineMinutes = shop.bookingRules.cancelDeadlineMinutes;
  return {
    view: toView(appointment),
    serviceId: appointment.serviceId,
    barberId: appointment.barberId,
    cancelUntilMs:
      deadlineMinutes > 0 ? appointment.startTime.getTime() - deadlineMinutes * 60_000 : null,
  };
}
