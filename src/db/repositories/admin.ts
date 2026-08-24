import "server-only";
import { and, asc, desc, eq, gte, ilike, inArray, lt, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { appointments, barbers, customers, services } from "@/db/schema";

/** Read models for the admin dashboard, calendar and customers pages. */

const activeStatuses = ["PENDING", "CONFIRMED"] as const;

export interface AdminAppointmentRow {
  id: string;
  customerId: string;
  barberId: string;
  serviceId: string;
  barberName: string;
  serviceName: { en: string; ne?: string };
  customerName: string;
  customerPhone: string;
  startMs: number;
  endMs: number;
  status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
  source: "ONLINE" | "ADMIN" | "WALK_IN";
  priceCents: number;
}

const rowSelection = {
  id: appointments.id,
  customerId: appointments.customerId,
  barberId: appointments.barberId,
  serviceId: appointments.serviceId,
  barberName: appointments.barberNameSnapshot,
  serviceName: appointments.serviceNameSnapshot,
  customerName: customers.name,
  customerPhone: customers.phone,
  startMs: appointments.startTime,
  endMs: appointments.endTime,
  status: appointments.status,
  source: appointments.source,
  priceCents: appointments.priceAtBookingCents,
};

/** Drizzle hands timestamps back as Date; the UI works in epoch ms. */
function toRow(
  raw: Omit<AdminAppointmentRow, "startMs" | "endMs"> & {
    startMs: Date;
    endMs: Date;
  },
): AdminAppointmentRow {
  return { ...raw, startMs: raw.startMs.getTime(), endMs: raw.endMs.getTime() };
}

/** Appointments starting within [startMs, endMs), newest first. */
export async function listAppointmentsBetween(
  shopId: string,
  startMs: number,
  endMs: number,
): Promise<AdminAppointmentRow[]> {
  const rows = await db
    .select(rowSelection)
    .from(appointments)
    .innerJoin(customers, eq(customers.id, appointments.customerId))
    .where(
      and(
        eq(appointments.shopId, shopId),
        gte(appointments.startTime, new Date(startMs)),
        lt(appointments.startTime, new Date(endMs)),
      ),
    )
    .orderBy(asc(appointments.startTime));
  return rows.map(toRow);
}

/** PENDING or CONFIRMED appointments starting at or after startMs. */
export async function listUpcomingAppointments(
  shopId: string,
  startMs: number,
  limit = 50,
): Promise<AdminAppointmentRow[]> {
  const rows = await db
    .select(rowSelection)
    .from(appointments)
    .innerJoin(customers, eq(customers.id, appointments.customerId))
    .where(
      and(
        eq(appointments.shopId, shopId),
        inArray(appointments.status, [...activeStatuses]),
        gte(appointments.startTime, new Date(startMs)),
      ),
    )
    .orderBy(asc(appointments.startTime))
    .limit(limit);
  return rows.map(toRow);
}

export interface AppointmentDetail extends AdminAppointmentRow {
  customerEmail: string | null;
  customerNotes: string | null;
  adminNotes: string | null;
  cancelReason: string | null;
  durationMinutes: number;
}

export async function getAppointmentDetail(
  shopId: string,
  appointmentId: string,
): Promise<AppointmentDetail | null> {
  const [raw] = await db
    .select({
      ...rowSelection,
      customerEmail: customers.email,
      customerNotes: appointments.customerNotes,
      adminNotes: appointments.adminNotes,
      cancelReason: appointments.cancelReason,
      durationMinutes: appointments.durationAtBookingMinutes,
    })
    .from(appointments)
    .innerJoin(customers, eq(customers.id, appointments.customerId))
    .where(and(eq(appointments.shopId, shopId), eq(appointments.id, appointmentId)))
    .limit(1);
  if (!raw) return null;
  const {
    customerEmail,
    customerNotes,
    adminNotes,
    cancelReason,
    durationMinutes,
    startMs,
    endMs,
    ...rest
  } = raw;
  return {
    ...toRow({ ...rest, startMs, endMs }),
    customerEmail,
    customerNotes,
    adminNotes,
    cancelReason,
    durationMinutes,
  };
}

export interface CustomerSummary {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  notes: string | null;
  visitCount: number;
  lastVisitMs: number | null;
}

/** Customers with booking counts; optional search over name and phone. */
export async function listCustomers(shopId: string, search?: string): Promise<CustomerSummary[]> {
  const visitCount = sql<number>`count(${appointments.id})::int`.as("visit_count");
  const lastVisit = sql<Date | null>`max(${appointments.startTime})`.as("last_visit");

  const condition = search
    ? and(
        eq(customers.shopId, shopId),
        or(ilike(customers.name, `%${search}%`), ilike(customers.phone, `%${search}%`)),
      )
    : eq(customers.shopId, shopId);

  const rows = await db
    .select({
      id: customers.id,
      name: customers.name,
      phone: customers.phone,
      email: customers.email,
      notes: customers.notes,
      visitCount,
      lastVisit,
    })
    .from(customers)
    .leftJoin(
      appointments,
      and(
        eq(appointments.customerId, customers.id),
        inArray(appointments.status, ["PENDING", "CONFIRMED", "COMPLETED", "NO_SHOW"]),
      ),
    )
    .where(condition)
    .groupBy(customers.id)
    .orderBy(desc(sql`max(${appointments.startTime})`), asc(customers.name));

  return rows.map((row) => ({
    ...row,
    lastVisitMs: toEpochMs(row.lastVisit),
  }));
}

/** Aggregates may surface timestamps as Date or raw strings depending on the driver. */
function toEpochMs(value: unknown): number | null {
  if (value instanceof Date) return value.getTime();
  if (typeof value === "string") {
    const ms = new Date(value).getTime();
    return Number.isNaN(ms) ? null : ms;
  }
  if (typeof value === "number") return value;
  return null;
}

export async function getCustomerHistory(
  shopId: string,
  customerId: string,
): Promise<AdminAppointmentRow[]> {
  const rows = await db
    .select(rowSelection)
    .from(appointments)
    .innerJoin(customers, eq(customers.id, appointments.customerId))
    .where(and(eq(appointments.shopId, shopId), eq(appointments.customerId, customerId)))
    .orderBy(desc(appointments.startTime));
  return rows.map(toRow);
}

/** Barbers for filter chips and reschedule pinning. */
export async function listActiveBarbers(
  shopId: string,
): Promise<{ id: string; displayName: string }[]> {
  return db
    .select({ id: barbers.id, displayName: barbers.displayName })
    .from(barbers)
    .where(and(eq(barbers.shopId, shopId), eq(barbers.active, true)))
    .orderBy(asc(barbers.displayOrder));
}

/** Service timing for staff reschedule probes. */
export async function getServiceTiming(
  serviceId: string,
): Promise<{ durationMinutes: number; bufferMinutes: number } | null> {
  const [row] = await db
    .select({
      durationMinutes: services.durationMinutes,
      bufferMinutes: services.bufferMinutes,
    })
    .from(services)
    .where(eq(services.id, serviceId))
    .limit(1);
  return row ?? null;
}
