import "server-only";
import { and, eq, gt, gte, lt, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  appointments,
  barbers,
  barberServices,
  breaks,
  closures,
  customers,
  services,
  shops,
  workingHours,
} from "@/db/schema";
import type {
  BreakRecord,
  ClosureRecord,
  BusyRange,
  WorkingHoursRecord,
} from "@/lib/scheduling/types";
import type { CustomerDetails } from "@/lib/validation/booking";

/**
 * Read models feeding the scheduling engine plus the write helpers the
 * booking transaction uses. Every query is shop scoped; callers pass
 * the shop resolved server-side by getShopContext.
 */

/** Anything that can run queries: the pool or an open transaction. */
export type QueryExecutor = Pick<typeof db, "select" | "insert" | "update">;

export async function loadWorkingHours(shopId: string): Promise<WorkingHoursRecord[]> {
  const rows = await db
    .select({
      barberId: workingHours.barberId,
      weekday: workingHours.weekday,
      intervals: workingHours.intervals,
    })
    .from(workingHours)
    .where(eq(workingHours.shopId, shopId));
  return rows.map((row) => ({
    barberId: row.barberId,
    weekday: row.weekday,
    intervals: row.intervals,
  }));
}

export async function loadBreaks(shopId: string): Promise<BreakRecord[]> {
  const rows = await db
    .select({
      barberId: breaks.barberId,
      kind: breaks.kind,
      weekday: breaks.weekday,
      oneOffDate: breaks.oneOffDate,
      startTime: breaks.startTime,
      endTime: breaks.endTime,
    })
    .from(breaks)
    .where(eq(breaks.shopId, shopId));
  return rows.map((row) => ({
    barberId: row.barberId,
    kind: row.kind,
    weekday: row.weekday,
    oneOffDate: row.oneOffDate,
    startTime: row.startTime,
    endTime: row.endTime,
  }));
}

export async function loadClosures(shopId: string): Promise<ClosureRecord[]> {
  const rows = await db
    .select({
      barberId: closures.barberId,
      startDate: closures.startDate,
      endDate: closures.endDate,
      fullDay: closures.fullDay,
      startTime: closures.startTime,
      endTime: closures.endTime,
    })
    .from(closures)
    .where(eq(closures.shopId, shopId));
  return rows;
}

/** Active PENDING/CONFIRMED appointments overlapping [fromMs, toMs). */
export async function loadBusyRanges(
  exec: QueryExecutor,
  shopId: string,
  fromMs: number,
  toMs: number,
): Promise<BusyRange[]> {
  const rows = await exec
    .select({
      barberId: appointments.barberId,
      startMs: appointments.startTime,
      endMs: appointments.endTime,
      status: appointments.status,
    })
    .from(appointments)
    .where(
      and(
        eq(appointments.shopId, shopId),
        sql`${appointments.status} IN ('PENDING', 'CONFIRMED')`,
        lt(appointments.startTime, new Date(toMs)),
        gt(appointments.endTime, new Date(fromMs)),
      ),
    );
  return rows.map((row) => ({
    barberId: row.barberId,
    startMs: row.startMs.getTime(),
    endMs: row.endMs.getTime(),
    status: row.status as BusyRange["status"],
  }));
}

/** Active barbers assigned to the service, in display order. */
export async function findEligibleBarbers(
  shopId: string,
  serviceId: string,
): Promise<{ id: string; displayName: string }[]> {
  const rows = await db
    .select({ id: barbers.id, displayName: barbers.displayName })
    .from(barberServices)
    .innerJoin(barbers, eq(barbers.id, barberServices.barberId))
    .where(
      and(
        eq(barberServices.serviceId, serviceId),
        eq(barbers.shopId, shopId),
        eq(barbers.active, true),
      ),
    )
    .orderBy(barbers.displayOrder);
  return rows;
}

export async function findActiveService(shopId: string, serviceId: string) {
  const [service] = await db
    .select()
    .from(services)
    .where(and(eq(services.id, serviceId), eq(services.shopId, shopId), eq(services.active, true)))
    .limit(1);
  return service ?? null;
}

export async function upsertCustomer(
  exec: QueryExecutor,
  shopId: string,
  details: CustomerDetails,
) {
  const [customer] = await exec
    .insert(customers)
    .values({
      shopId,
      name: details.name,
      phone: details.phone,
      email: details.email ?? null,
    })
    .onConflictDoUpdate({
      target: [customers.shopId, customers.phone],
      set: { name: details.name, email: details.email ?? null },
    })
    .returning({ id: customers.id });
  return customer.id;
}

export async function countActiveBookingsOnDay(
  exec: QueryExecutor,
  customerId: string,
  fromMs: number,
  toMs: number,
): Promise<number> {
  const [row] = await exec
    .select({ count: sql<number>`count(*)::int` })
    .from(appointments)
    .where(
      and(
        eq(appointments.customerId, customerId),
        sql`${appointments.status} IN ('PENDING', 'CONFIRMED')`,
        gte(appointments.startTime, new Date(fromMs)),
        lt(appointments.startTime, new Date(toMs)),
      ),
    );
  return row?.count ?? 0;
}

export async function findAppointmentByTokenHash(tokenHash: string) {
  const [row] = await db
    .select({
      appointment: appointments,
      customerName: customers.name,
      customerEmail: customers.email,
    })
    .from(appointments)
    .innerJoin(customers, eq(customers.id, appointments.customerId))
    .where(eq(appointments.lookupTokenHash, tokenHash))
    .limit(1);
  if (!row) return null;
  return {
    ...row.appointment,
    customerName: row.customerName,
    customerEmail: row.customerEmail,
  };
}

export async function findShopById(shopId: string) {
  const [shop] = await db.select().from(shops).where(eq(shops.id, shopId)).limit(1);
  return shop ?? null;
}
