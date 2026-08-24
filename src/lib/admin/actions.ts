"use server";

import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { appointments } from "@/db/schema";
import type { Appointment } from "@/db/schema";
import { requireOwner } from "@/lib/auth/session";
import { getShopContext } from "@/lib/tenant";
import { wallClockTimeSchema } from "@/lib/validation/schedule";
import { dateKeySchema } from "@/lib/validation/booking";
import { addDaysToDateKey, wallTimeToEpochMs } from "@/lib/scheduling/format";
import {
  findActiveService,
  loadBreaks,
  loadBusyRanges,
  loadClosures,
  loadWorkingHours,
} from "@/db/repositories/booking";
import { barbersForExactSlot } from "@/lib/scheduling/availability";

/**
 * Staff appointment mutations. requireOwner is the boundary (AD-08):
 * no rate limiting and no lookup tokens here. Staff reschedule skips
 * customer facing notice rules on purpose; the exclusion constraint
 * still arbitrates capacity.
 */

export type AdminActionResult =
  | { ok: true }
  | { ok: false; code: "NOT_FOUND" | "STATE_CONFLICT" | "SLOT_UNAVAILABLE" | "INVALID_INPUT" };

/** Allowed current statuses per staff action; anything else conflicts. */
const TRANSITIONS: Record<"confirm" | "complete" | "noShow" | "cancel", Appointment["status"][]> = {
  confirm: ["PENDING"],
  complete: ["PENDING", "CONFIRMED"],
  noShow: ["PENDING", "CONFIRMED"],
  cancel: ["PENDING", "CONFIRMED"],
};

const TARGET_STATUS = {
  confirm: "CONFIRMED",
  complete: "COMPLETED",
  noShow: "NO_SHOW",
  cancel: "CANCELLED",
} as const;

async function loadOwnedAppointment(shopId: string, appointmentId: string) {
  const [row] = await db
    .select()
    .from(appointments)
    .where(and(eq(appointments.shopId, shopId), eq(appointments.id, appointmentId)))
    .limit(1);
  return row ?? null;
}

export async function setAppointmentStatusAction(raw: unknown): Promise<AdminActionResult> {
  const session = await requireOwner();
  const parsed = z
    .object({
      appointmentId: z.uuid(),
      action: z.enum(["confirm", "complete", "noShow", "cancel"]),
      reason: z.string().trim().max(300).optional(),
    })
    .safeParse(raw);
  if (!parsed.success) return { ok: false, code: "INVALID_INPUT" };

  const appointment = await loadOwnedAppointment(session.user.shopId, parsed.data.appointmentId);
  if (!appointment) return { ok: false, code: "NOT_FOUND" };
  const { action } = parsed.data;
  if (!TRANSITIONS[action].includes(appointment.status)) {
    return { ok: false, code: "STATE_CONFLICT" };
  }

  await db
    .update(appointments)
    .set({
      status: TARGET_STATUS[action],
      ...(action === "cancel"
        ? { cancelReason: parsed.data.reason ?? appointment.cancelReason ?? "Cancelled by staff" }
        : {}),
      updatedAt: new Date(),
    })
    .where(eq(appointments.id, appointment.id));
  return { ok: true };
}

export async function updateAdminNotesAction(raw: unknown): Promise<AdminActionResult> {
  const session = await requireOwner();
  const parsed = z
    .object({ appointmentId: z.uuid(), notes: z.string().trim().max(1000) })
    .safeParse(raw);
  if (!parsed.success) return { ok: false, code: "INVALID_INPUT" };

  const appointment = await loadOwnedAppointment(session.user.shopId, parsed.data.appointmentId);
  if (!appointment) return { ok: false, code: "NOT_FOUND" };

  await db
    .update(appointments)
    .set({
      adminNotes: parsed.data.notes === "" ? null : parsed.data.notes,
      updatedAt: new Date(),
    })
    .where(eq(appointments.id, appointment.id));
  return { ok: true };
}

export async function rescheduleByStaffAction(raw: unknown): Promise<AdminActionResult> {
  const session = await requireOwner();
  const parsed = z
    .object({
      appointmentId: z.uuid(),
      dateKey: dateKeySchema,
      time: wallClockTimeSchema,
    })
    .safeParse(raw);
  if (!parsed.success) return { ok: false, code: "INVALID_INPUT" };

  const [shop, appointment] = await Promise.all([
    getShopContext(),
    loadOwnedAppointment(session.user.shopId, parsed.data.appointmentId),
  ]);
  if (!appointment) return { ok: false, code: "NOT_FOUND" };
  if (appointment.status !== "PENDING" && appointment.status !== "CONFIRMED") {
    return { ok: false, code: "STATE_CONFLICT" };
  }

  // Buffer comes from the live service; snapshots do not store it.
  const service = await findActiveService(shop.id, appointment.serviceId);

  const rows = await loadWorkingHours(shop.id);
  const barberHours: Record<string, typeof rows> = {};
  for (const row of rows) {
    if (row.barberId === null) continue;
    (barberHours[row.barberId] ??= []).push(row);
  }

  const startMs = wallTimeToEpochMs(shop.timezone, parsed.data.dateKey, parsed.data.time);

  // The moved appointment vacates its own range first.
  const margin = 36 * 3_600_000;
  const windowStart = wallTimeToEpochMs(shop.timezone, parsed.data.dateKey, "00:00") - margin;
  const windowEnd =
    wallTimeToEpochMs(shop.timezone, addDaysToDateKey(parsed.data.dateKey, 1), "00:00") + margin;
  const busy = (await loadBusyRanges(db, shop.id, windowStart, windowEnd)).filter(
    (range) => range.startMs !== appointment.startTime.getTime(),
  );

  const fitting = barbersForExactSlot(
    {
      zone: shop.timezone,
      service: {
        durationMinutes: appointment.durationAtBookingMinutes,
        bufferMinutes: service?.bufferMinutes ?? 0,
      },
      barberIds: [appointment.barberId],
      shopHours: rows,
      barberHours,
      breaks: await loadBreaks(shop.id),
      closures: await loadClosures(shop.id),
    },
    parsed.data.dateKey,
    startMs,
    busy,
  );
  if (fitting.length === 0) return { ok: false, code: "SLOT_UNAVAILABLE" };

  const endMs = startMs + appointment.durationAtBookingMinutes * 60_000;

  try {
    await db.transaction(async () => {
      await db
        .update(appointments)
        .set({ startTime: new Date(startMs), endTime: new Date(endMs), updatedAt: new Date() })
        .where(eq(appointments.id, appointment.id));
    });
    return { ok: true };
  } catch (error) {
    let cause: unknown = error;
    while (cause != null) {
      if ((cause as { code?: string }).code === "23P01") {
        return { ok: false, code: "SLOT_UNAVAILABLE" };
      }
      cause = (cause as { cause?: unknown }).cause;
    }
    throw error;
  }
}
