"use server";

import { headers } from "next/headers";
import { getShopContext } from "@/lib/tenant";
import { rateLimit } from "@/lib/rate-limit";
import { z } from "zod";
import {
  availabilityQuerySchema,
  cancelBookingSchema,
  createBookingSchema,
  rescheduleBookingSchema,
} from "@/lib/validation/booking";
import {
  cancelByCustomerCore,
  createBookingCore,
  getAvailabilityCore,
  lookupAppointmentCore,
  rescheduleByCustomerCore,
} from "./core";
import type { BookingFailure, CreateBookingResult, LookupResult, MutationResult } from "./types";
import type { Slot } from "@/lib/scheduling/types";

/**
 * Public booking server actions. Boundary contract (AD-08): validate,
 * resolve tenant, rate limit, delegate to the transactional core.
 */

function invalid(message = "Invalid input"): BookingFailure {
  return { ok: false, code: "INVALID_INPUT", detail: message };
}

async function clientKey(action: string): Promise<string> {
  const store = await headers();
  const forwarded = store.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || store.get("x-real-ip") || "unknown";
  return `${action}:${ip}`;
}

const LIMITS = {
  availability: { limit: 60, windowMs: 60_000 },
  create: { limit: 5, windowMs: 60_000 },
  manage: { limit: 20, windowMs: 60_000 },
} as const;

export async function getAvailabilityAction(raw: unknown): Promise<Slot[] | BookingFailure> {
  if (!(await rateCheck("availability", LIMITS.availability))) {
    return { ok: false, code: "RATE_LIMITED" };
  }
  const parsed = availabilityQuerySchema.safeParse(raw);
  if (!parsed.success) return invalid();
  const shop = await getShopContext();
  return getAvailabilityCore(shop, parsed.data);
}

export async function createBookingAction(raw: unknown): Promise<CreateBookingResult> {
  if (!(await rateCheck("create", LIMITS.create))) {
    return { ok: false, code: "RATE_LIMITED" };
  }
  const parsed = createBookingSchema.safeParse(raw);
  if (!parsed.success) return invalid();
  const shop = await getShopContext();
  return createBookingCore(shop, parsed.data);
}

export async function cancelBookingAction(raw: unknown): Promise<MutationResult> {
  if (!(await rateCheck("manage", LIMITS.manage))) {
    return { ok: false, code: "RATE_LIMITED" };
  }
  const parsed = cancelBookingSchema.safeParse(raw);
  if (!parsed.success) return invalid();
  const shop = await getShopContext();
  return cancelByCustomerCore(shop, parsed.data);
}

export async function rescheduleBookingAction(raw: unknown): Promise<LookupResult> {
  if (!(await rateCheck("manage", LIMITS.manage))) {
    return { ok: false, code: "RATE_LIMITED" };
  }
  const parsed = rescheduleBookingSchema.safeParse(raw);
  if (!parsed.success) return invalid();
  const shop = await getShopContext();
  return rescheduleByCustomerCore(shop, parsed.data);
}

export async function lookupAppointmentAction(token: string): Promise<LookupResult> {
  if (!(await rateCheck("manage", LIMITS.manage))) {
    return { ok: false, code: "RATE_LIMITED" };
  }
  const parsed = z.string().min(20).max(100).safeParse(token);
  if (!parsed.success) return { ok: false, code: "NOT_FOUND" };
  const shop = await getShopContext();
  return lookupAppointmentCore(shop, parsed.data);
}

async function rateCheck(
  scope: keyof typeof LIMITS,
  config: { limit: number; windowMs: number },
): Promise<boolean> {
  return rateLimit(await clientKey(scope), config.limit, config.windowMs);
}
