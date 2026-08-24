import "server-only";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { barberServices, barbers, services } from "@/db/schema";
import type { LocalizedText } from "@/i18n/localized-text";

/** Read models for public pages: active catalog data only. */

export interface PublicService {
  id: string;
  name: LocalizedText;
  description: LocalizedText | null;
  durationMinutes: number;
  bufferMinutes: number;
  priceCents: number;
  imageUrl: string | null;
}

export async function getActiveServices(shopId: string): Promise<PublicService[]> {
  return db
    .select({
      id: services.id,
      name: services.name,
      description: services.description,
      durationMinutes: services.durationMinutes,
      bufferMinutes: services.bufferMinutes,
      priceCents: services.priceCents,
      imageUrl: services.imageUrl,
    })
    .from(services)
    .where(and(eq(services.shopId, shopId), eq(services.active, true)))
    .orderBy(asc(services.displayOrder));
}

export interface PublicBarber {
  id: string;
  displayName: string;
  bio: LocalizedText | null;
  photoUrl: string | null;
}

export async function getActiveBarbers(shopId: string): Promise<PublicBarber[]> {
  return db
    .select({
      id: barbers.id,
      displayName: barbers.displayName,
      bio: barbers.bio,
      photoUrl: barbers.photoUrl,
    })
    .from(barbers)
    .where(and(eq(barbers.shopId, shopId), eq(barbers.active, true)))
    .orderBy(asc(barbers.displayOrder));
}

/** Which active barbers can perform which service, keyed by service id. */
export async function getBarbersPerService(
  shopId: string,
): Promise<Map<string, { id: string; displayName: string }[]>> {
  const rows = await db
    .select({
      serviceId: barberServices.serviceId,
      id: barbers.id,
      displayName: barbers.displayName,
      displayOrder: barbers.displayOrder,
    })
    .from(barberServices)
    .innerJoin(barbers, eq(barbers.id, barberServices.barberId))
    .where(and(eq(barbers.shopId, shopId), eq(barbers.active, true)))
    .orderBy(asc(barbers.displayOrder));

  const map = new Map<string, { id: string; displayName: string }[]>();
  for (const row of rows) {
    const list = map.get(row.serviceId) ?? [];
    list.push({ id: row.id, displayName: row.displayName });
    map.set(row.serviceId, list);
  }
  return map;
}
