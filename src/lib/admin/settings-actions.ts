"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireOwner } from "@/lib/auth/session";
import { getShopContext } from "@/lib/tenant";
import type { LocalizedText } from "@/i18n/localized-text";
import {
  barberInputSchema,
  bookingRulesSchema,
  breakInputSchema,
  closureInputSchema,
  dayHoursInputSchema,
  serviceInputSchema,
  shopProfileInputSchema,
} from "@/lib/validation/admin";
import { brandingConfigSchema, homepageConfigSchema } from "@/lib/validation/shop-config";
import {
  countBarberAppointments,
  countServiceAppointments,
  createBarber,
  createBreak,
  createClosure,
  createService,
  deleteBarber,
  deleteBreak,
  deleteClosure,
  deleteService,
  reorderServices,
  saveHoursForScope,
  setBarberServices,
  updateBranding,
  updateBarber,
  updateBookingRules,
  updateHomepageSections,
  updateService,
  updateShopProfile,
} from "@/db/repositories/shop-config";

/**
 * Settings mutations. requireOwner is the boundary (AD-08); zod shapes
 * come from validation/admin.ts and mirror the JSONB column contracts.
 */

export type SettingsActionResult =
  { ok: true } | { ok: false; code: "NOT_FOUND" | "IN_USE" | "INVALID_INPUT" | "GENERIC" };

function toLocalized(input: { en: string; ne?: string } | undefined): LocalizedText | null {
  if (!input) return null;
  return input.ne ? { en: input.en, ne: input.ne } : { en: input.en };
}

function revalidateSettings(): void {
  // Public pages read at request time (AD-12); this covers cached admin trees.
  revalidatePath("/", "layout");
}

export async function upsertServiceAction(raw: unknown): Promise<SettingsActionResult> {
  await requireOwner();
  const shop = await getShopContext();
  const parsed = z
    .object({ id: z.uuid().optional() })
    .extend(serviceInputSchema.shape)
    .safeParse(raw);
  if (!parsed.success) return { ok: false, code: "INVALID_INPUT" };

  const values = {
    name: toLocalized(parsed.data.name)!,
    description: toLocalized(parsed.data.description),
    durationMinutes: parsed.data.durationMinutes,
    bufferMinutes: parsed.data.bufferMinutes,
    priceCents: parsed.data.priceCents,
  };
  try {
    if (parsed.data.id) {
      await updateService(shop.id, parsed.data.id, values);
    } else {
      await createService({ shopId: shop.id, ...values });
    }
  } catch {
    return { ok: false, code: "GENERIC" };
  }
  revalidateSettings();
  return { ok: true };
}

export async function toggleServiceActiveAction(raw: unknown): Promise<SettingsActionResult> {
  await requireOwner();
  const shop = await getShopContext();
  const parsed = z.object({ id: z.uuid(), active: z.boolean() }).safeParse(raw);
  if (!parsed.success) return { ok: false, code: "INVALID_INPUT" };
  await updateService(shop.id, parsed.data.id, { active: parsed.data.active });
  revalidateSettings();
  return { ok: true };
}

export async function reorderServicesAction(raw: unknown): Promise<SettingsActionResult> {
  await requireOwner();
  const shop = await getShopContext();
  const parsed = z.object({ orderedIds: z.array(z.uuid()).min(1) }).safeParse(raw);
  if (!parsed.success) return { ok: false, code: "INVALID_INPUT" };
  await reorderServices(shop.id, parsed.data.orderedIds);
  revalidateSettings();
  return { ok: true };
}

export async function deleteServiceAction(raw: unknown): Promise<SettingsActionResult> {
  await requireOwner();
  const shop = await getShopContext();
  const parsed = z.object({ id: z.uuid() }).safeParse(raw);
  if (!parsed.success) return { ok: false, code: "INVALID_INPUT" };
  const inUse = await countServiceAppointments(shop.id, parsed.data.id);
  if (inUse > 0) return { ok: false, code: "IN_USE" };
  await deleteService(shop.id, parsed.data.id);
  revalidateSettings();
  return { ok: true };
}

export async function upsertBarberAction(raw: unknown): Promise<SettingsActionResult> {
  await requireOwner();
  const shop = await getShopContext();
  const parsed = z
    .object({ id: z.uuid().optional(), serviceIds: z.array(z.uuid()).max(100).default([]) })
    .extend(barberInputSchema.shape)
    .safeParse(raw);
  if (!parsed.success) return { ok: false, code: "INVALID_INPUT" };

  const values = {
    displayName: parsed.data.displayName,
    bio: toLocalized(parsed.data.bio),
  };
  try {
    let barberId = parsed.data.id;
    if (barberId) {
      await updateBarber(shop.id, barberId, values);
    } else {
      barberId = await createBarber({ shopId: shop.id, ...values });
    }
    await setBarberServices(barberId, parsed.data.serviceIds);
  } catch {
    return { ok: false, code: "GENERIC" };
  }
  revalidateSettings();
  return { ok: true };
}

export async function toggleBarberActiveAction(raw: unknown): Promise<SettingsActionResult> {
  await requireOwner();
  const shop = await getShopContext();
  const parsed = z.object({ id: z.uuid(), active: z.boolean() }).safeParse(raw);
  if (!parsed.success) return { ok: false, code: "INVALID_INPUT" };
  await updateBarber(shop.id, parsed.data.id, { active: parsed.data.active });
  revalidateSettings();
  return { ok: true };
}

export async function deleteBarberAction(raw: unknown): Promise<SettingsActionResult> {
  await requireOwner();
  const shop = await getShopContext();
  const parsed = z.object({ id: z.uuid() }).safeParse(raw);
  if (!parsed.success) return { ok: false, code: "INVALID_INPUT" };
  const inUse = await countBarberAppointments(shop.id, parsed.data.id);
  if (inUse > 0) return { ok: false, code: "IN_USE" };
  await deleteBarber(shop.id, parsed.data.id);
  revalidateSettings();
  return { ok: true };
}

/** Scope is the shop itself or one barber; rows replace wholesale. */
export async function saveScheduleAction(raw: unknown): Promise<SettingsActionResult> {
  await requireOwner();
  const shop = await getShopContext();
  const parsed = z
    .object({ barberId: z.uuid().nullable(), days: dayHoursInputSchema })
    .safeParse(raw);
  if (!parsed.success) return { ok: false, code: "INVALID_INPUT" };

  const days = parsed.data.days.filter((day) => day.intervals.length > 0);
  for (const day of days) {
    const starts = day.intervals.map((interval) => interval.start).sort();
    for (let i = 1; i < starts.length; i += 1) {
      const previous = day.intervals.find((interval) => interval.start === starts[i - 1])!;
      const current = day.intervals.find((interval) => interval.start === starts[i])!;
      if (previous.end > current.start) return { ok: false, code: "INVALID_INPUT" };
    }
  }

  await saveHoursForScope(
    shop.id,
    parsed.data.barberId,
    days.map((day) => ({
      weekday: day.weekday,
      intervals: [...day.intervals].sort((a, b) => a.start.localeCompare(b.start)),
    })),
  );
  revalidateSettings();
  return { ok: true };
}

export async function createBreakAction(raw: unknown): Promise<SettingsActionResult> {
  await requireOwner();
  const shop = await getShopContext();
  const parsed = breakInputSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, code: "INVALID_INPUT" };
  await createBreak({ shopId: shop.id, ...parsed.data });
  revalidateSettings();
  return { ok: true };
}

export async function deleteBreakAction(raw: unknown): Promise<SettingsActionResult> {
  await requireOwner();
  const shop = await getShopContext();
  const parsed = z.object({ id: z.uuid() }).safeParse(raw);
  if (!parsed.success) return { ok: false, code: "INVALID_INPUT" };
  await deleteBreak(shop.id, parsed.data.id);
  revalidateSettings();
  return { ok: true };
}

export async function createClosureAction(raw: unknown): Promise<SettingsActionResult> {
  await requireOwner();
  const shop = await getShopContext();
  const parsed = closureInputSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, code: "INVALID_INPUT" };
  await createClosure({ shopId: shop.id, ...parsed.data });
  revalidateSettings();
  return { ok: true };
}

export async function deleteClosureAction(raw: unknown): Promise<SettingsActionResult> {
  await requireOwner();
  const shop = await getShopContext();
  const parsed = z.object({ id: z.uuid() }).safeParse(raw);
  if (!parsed.success) return { ok: false, code: "INVALID_INPUT" };
  await deleteClosure(shop.id, parsed.data.id);
  revalidateSettings();
  return { ok: true };
}

export async function saveBookingRulesAction(raw: unknown): Promise<SettingsActionResult> {
  await requireOwner();
  const shop = await getShopContext();
  const parsed = bookingRulesSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, code: "INVALID_INPUT" };
  await updateBookingRules(shop.id, parsed.data);
  revalidateSettings();
  return { ok: true };
}

export async function saveShopProfileAction(raw: unknown): Promise<SettingsActionResult> {
  await requireOwner();
  const shop = await getShopContext();
  const parsed = shopProfileInputSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, code: "INVALID_INPUT" };
  const data = parsed.data;
  await updateShopProfile(shop.id, {
    name: data.name,
    shortName: data.shortName || null,
    tagline: data.tagline || null,
    description: data.description || null,
    ...(data.contact
      ? {
          contact: data.contact,
        }
      : {}),
    ...(data.location ? { location: data.location } : {}),
    ...(data.social ? { social: data.social } : {}),
  });
  revalidateSettings();
  return { ok: true };
}

const brandingInputSchema = brandingConfigSchema.extend({
  logoUrl: z.union([z.url().max(500), z.literal("")]).optional(),
  faviconUrl: z.union([z.url().max(500), z.literal("")]).optional(),
});

/** Whole-object replace; the client always sends the complete draft. */
export async function saveBrandingAction(raw: unknown): Promise<SettingsActionResult> {
  await requireOwner();
  const shop = await getShopContext();
  const parsed = brandingInputSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, code: "INVALID_INPUT" };
  const { logoUrl, faviconUrl, ...rest } = parsed.data;
  await updateBranding(shop.id, {
    ...rest,
    ...(logoUrl ? { logoUrl } : {}),
    ...(faviconUrl ? { faviconUrl } : {}),
  });
  revalidateSettings();
  return { ok: true };
}

/**
 * Homepage sections are validated for shape and uniqueness; the order in
 * the array is the render order. Content passthrough stays permissive so
 * future section editors can ship without a migration.
 */
export async function saveHomepageAction(raw: unknown): Promise<SettingsActionResult> {
  await requireOwner();
  const shop = await getShopContext();
  const parsed = homepageConfigSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, code: "INVALID_INPUT" };
  const types = parsed.data.sections.map((section) => section.type);
  if (new Set(types).size !== types.length) return { ok: false, code: "INVALID_INPUT" };
  await updateHomepageSections(shop.id, parsed.data);
  revalidateSettings();
  return { ok: true };
}
