import "server-only";
import { and, asc, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  appointments,
  barberServices,
  barbers,
  breaks,
  closures,
  services,
  shops,
  workingHours,
} from "@/db/schema";
import type {
  BrandingConfig,
  BookingRules,
  ContactInfo,
  HomepageConfig,
  LocationInfo,
  SocialLinks,
} from "@/lib/validation/shop-config";
import type { LocalizedText } from "@/i18n/localized-text";
import type { WorkingInterval } from "@/lib/validation/schedule";

/**
 * Authored configuration data access for the settings admin. Every
 * function takes shopId explicitly; hard deletes are gated on having
 * no appointment references (the FKs are ON DELETE RESTRICT).
 */

export interface ServiceRow {
  id: string;
  name: LocalizedText;
  description: LocalizedText | null;
  durationMinutes: number;
  bufferMinutes: number;
  priceCents: number;
  imageUrl: string | null;
  active: boolean;
  displayOrder: number;
}

export async function listServices(shopId: string): Promise<ServiceRow[]> {
  return db
    .select({
      id: services.id,
      name: services.name,
      description: services.description,
      durationMinutes: services.durationMinutes,
      bufferMinutes: services.bufferMinutes,
      priceCents: services.priceCents,
      imageUrl: services.imageUrl,
      active: services.active,
      displayOrder: services.displayOrder,
    })
    .from(services)
    .where(eq(services.shopId, shopId))
    .orderBy(asc(services.displayOrder), asc(services.name));
}

export async function countServiceAppointments(shopId: string, serviceId: string): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(appointments)
    .innerJoin(services, eq(services.id, appointments.serviceId))
    .where(and(eq(services.shopId, shopId), eq(services.id, serviceId)));
  return row?.count ?? 0;
}

/** Insert with the next display order at the tail. */
export async function createService(input: {
  shopId: string;
  name: LocalizedText;
  description: LocalizedText | null;
  durationMinutes: number;
  bufferMinutes: number;
  priceCents: number;
}): Promise<string> {
  const [{ maxOrder }] = await db
    .select({ maxOrder: sql<number>`coalesce(max(${services.displayOrder}), -1)::int` })
    .from(services)
    .where(eq(services.shopId, input.shopId));
  const [row] = await db
    .insert(services)
    .values({ ...input, displayOrder: maxOrder + 1 })
    .returning({ id: services.id });
  return row.id;
}

export async function updateService(
  shopId: string,
  serviceId: string,
  patch: Partial<{
    name: LocalizedText;
    description: LocalizedText | null;
    durationMinutes: number;
    bufferMinutes: number;
    priceCents: number;
    active: boolean;
  }>,
): Promise<void> {
  await db
    .update(services)
    .set(patch)
    .where(and(eq(services.shopId, shopId), eq(services.id, serviceId)));
}

/** Hard delete; caller must have checked zero appointment references. */
export async function deleteService(shopId: string, serviceId: string): Promise<void> {
  await db.delete(services).where(and(eq(services.shopId, shopId), eq(services.id, serviceId)));
}

export async function reorderServices(shopId: string, orderedIds: string[]): Promise<void> {
  await db.transaction(async () => {
    for (const [index, id] of orderedIds.entries()) {
      await db
        .update(services)
        .set({ displayOrder: index })
        .where(and(eq(services.shopId, shopId), eq(services.id, id)));
    }
  });
}

export interface BarberRow {
  id: string;
  displayName: string;
  bio: LocalizedText | null;
  photoUrl: string | null;
  active: boolean;
  displayOrder: number;
  serviceIds: string[];
}

export async function listBarbers(shopId: string): Promise<BarberRow[]> {
  const rows = await db
    .select({
      id: barbers.id,
      displayName: barbers.displayName,
      bio: barbers.bio,
      photoUrl: barbers.photoUrl,
      active: barbers.active,
      displayOrder: barbers.displayOrder,
    })
    .from(barbers)
    .where(eq(barbers.shopId, shopId))
    .orderBy(asc(barbers.displayOrder), asc(barbers.displayName));

  const links = await db
    .select({ barberId: barberServices.barberId, serviceId: barberServices.serviceId })
    .from(barberServices)
    .innerJoin(barbers, eq(barbers.id, barberServices.barberId))
    .where(eq(barbers.shopId, shopId));

  return rows.map((row) => ({
    ...row,
    serviceIds: links.filter((link) => link.barberId === row.id).map((link) => link.serviceId),
  }));
}

export async function countBarberAppointments(shopId: string, barberId: string): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(appointments)
    .innerJoin(barbers, eq(barbers.id, appointments.barberId))
    .where(and(eq(barbers.shopId, shopId), eq(barbers.id, barberId)));
  return row?.count ?? 0;
}

export async function createBarber(input: {
  shopId: string;
  displayName: string;
  bio: LocalizedText | null;
}): Promise<string> {
  const [{ maxOrder }] = await db
    .select({ maxOrder: sql<number>`coalesce(max(${barbers.displayOrder}), -1)::int` })
    .from(barbers)
    .where(eq(barbers.shopId, input.shopId));
  const [row] = await db
    .insert(barbers)
    .values({ ...input, name: input.displayName, displayOrder: maxOrder + 1 })
    .returning({ id: barbers.id });
  return row.id;
}

export async function updateBarber(
  shopId: string,
  barberId: string,
  patch: Partial<{ displayName: string; bio: LocalizedText | null; active: boolean }>,
): Promise<void> {
  const { displayName, ...rest } = patch;
  await db
    .update(barbers)
    .set(displayName === undefined ? rest : { ...rest, name: displayName })
    .where(and(eq(barbers.shopId, shopId), eq(barbers.id, barberId)));
}

export async function deleteBarber(shopId: string, barberId: string): Promise<void> {
  await db.delete(barbers).where(and(eq(barbers.shopId, shopId), eq(barbers.id, barberId)));
}

/** Replace the full service assignment set for one barber. */
export async function setBarberServices(barberId: string, serviceIds: string[]): Promise<void> {
  await db.transaction(async () => {
    await db.delete(barberServices).where(eq(barberServices.barberId, barberId));
    if (serviceIds.length > 0) {
      await db
        .insert(barberServices)
        .values(serviceIds.map((serviceId) => ({ barberId, serviceId })));
    }
  });
}

export interface DayHoursRow {
  weekday: number;
  intervals: WorkingInterval[];
}

export async function listHoursForScope(
  shopId: string,
  barberId: string | null,
): Promise<DayHoursRow[]> {
  return db
    .select({ weekday: workingHours.weekday, intervals: workingHours.intervals })
    .from(workingHours)
    .where(
      and(
        eq(workingHours.shopId, shopId),
        barberId === null ? isNull(workingHours.barberId) : eq(workingHours.barberId, barberId),
      ),
    )
    .orderBy(asc(workingHours.weekday));
}

/** Replace-all within one scope so partial saves cannot strand stale days. */
export async function saveHoursForScope(
  shopId: string,
  barberId: string | null,
  days: DayHoursRow[],
): Promise<void> {
  await db.transaction(async () => {
    await db
      .delete(workingHours)
      .where(
        and(
          eq(workingHours.shopId, shopId),
          barberId === null ? isNull(workingHours.barberId) : eq(workingHours.barberId, barberId),
        ),
      );
    if (days.length > 0) {
      await db
        .insert(workingHours)
        .values(
          days.map((day) => ({ shopId, barberId, weekday: day.weekday, intervals: day.intervals })),
        );
    }
  });
}

export interface BreakRow {
  id: string;
  barberId: string | null;
  kind: "RECURRING" | "ONE_OFF";
  weekday: number | null;
  oneOffDate: string | null;
  startTime: string;
  endTime: string;
  reason: string | null;
}

export async function listBreaks(shopId: string): Promise<BreakRow[]> {
  return db
    .select({
      id: breaks.id,
      barberId: breaks.barberId,
      kind: breaks.kind,
      weekday: breaks.weekday,
      oneOffDate: breaks.oneOffDate,
      startTime: breaks.startTime,
      endTime: breaks.endTime,
      reason: breaks.reason,
    })
    .from(breaks)
    .where(eq(breaks.shopId, shopId));
}

export async function createBreak(input: {
  shopId: string;
  barberId: string | null;
  kind: "RECURRING" | "ONE_OFF";
  weekday: number | null;
  oneOffDate: string | null;
  startTime: string;
  endTime: string;
  reason: string | null;
}): Promise<string> {
  const [row] = await db.insert(breaks).values(input).returning({ id: breaks.id });
  return row.id;
}

export async function deleteBreak(shopId: string, breakId: string): Promise<void> {
  await db.delete(breaks).where(and(eq(breaks.shopId, shopId), eq(breaks.id, breakId)));
}

export interface ClosureRow {
  id: string;
  barberId: string | null;
  startDate: string;
  endDate: string;
  fullDay: boolean;
  startTime: string | null;
  endTime: string | null;
  reason: string | null;
}

export async function listClosures(shopId: string): Promise<ClosureRow[]> {
  return db
    .select({
      id: closures.id,
      barberId: closures.barberId,
      startDate: closures.startDate,
      endDate: closures.endDate,
      fullDay: closures.fullDay,
      startTime: closures.startTime,
      endTime: closures.endTime,
      reason: closures.reason,
    })
    .from(closures)
    .where(eq(closures.shopId, shopId))
    .orderBy(asc(closures.startDate));
}

export async function createClosure(input: {
  shopId: string;
  barberId: string | null;
  startDate: string;
  endDate: string;
  fullDay: boolean;
  startTime: string | null;
  endTime: string | null;
  reason: string | null;
}): Promise<string> {
  const [row] = await db.insert(closures).values(input).returning({ id: closures.id });
  return row.id;
}

export async function deleteClosure(shopId: string, closureId: string): Promise<void> {
  await db.delete(closures).where(and(eq(closures.shopId, shopId), eq(closures.id, closureId)));
}

export async function updateBookingRules(shopId: string, rules: BookingRules): Promise<void> {
  await db.update(shops).set({ bookingRules: rules }).where(eq(shops.id, shopId));
}

/** Branding is a JSONB column; the action hands over an already validated object. */
export async function updateBranding(shopId: string, branding: BrandingConfig): Promise<void> {
  await db.update(shops).set({ branding }).where(eq(shops.id, shopId));
}

export async function updateHomepageSections(
  shopId: string,
  homepage: HomepageConfig,
): Promise<void> {
  await db.update(shops).set({ homepage }).where(eq(shops.id, shopId));
}

export async function updateShopProfile(
  shopId: string,
  patch: {
    name?: string;
    shortName?: string | null;
    tagline?: string | null;
    description?: string | null;
    contact?: ContactInfo;
    location?: LocationInfo;
    social?: SocialLinks;
  },
): Promise<void> {
  await db.update(shops).set(patch).where(eq(shops.id, shopId));
}
