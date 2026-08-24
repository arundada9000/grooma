import "server-only";
import { getShopContext } from "@/lib/tenant";
import {
  createAdminNotifications,
  finalizeEmail,
  listOwnerIdsByShop,
  queueEmail,
} from "@/db/repositories/notifications";
import { renderAppointmentEmail } from "./templates";
import { resolveEmailChannel } from "./providers";
import type { AppointmentEventData } from "./types";

/**
 * Lifecycle fan-out. Called AFTER the business mutation committed:
 * dispatch failures are logged, never thrown, so a broken email leg can
 * never turn a successful booking into a failed response. Admin in-app
 * rows cover new bookings, cancellations and reschedules (spec 37);
 * every event kind emails the customer when an address is known (36).
 */

const ADMIN_IN_APP_KINDS: ReadonlySet<AppointmentEventData["kind"]> = new Set([
  "BOOKED",
  "CANCELLED",
  "RESCHEDULED",
]);

const IN_APP_TYPES = {
  BOOKED: "APPOINTMENT_BOOKED",
  CONFIRMED: "APPOINTMENT_CONFIRMED",
  CANCELLED: "APPOINTMENT_CANCELLED",
  RESCHEDULED: "APPOINTMENT_RESCHEDULED",
} as const;

export async function dispatchAppointmentEvent(event: AppointmentEventData): Promise<void> {
  if (ADMIN_IN_APP_KINDS.has(event.kind)) {
    try {
      const ownerIds = await listOwnerIdsByShop(event.shop.id);
      await createAdminNotifications(event.shop.id, ownerIds, {
        type: IN_APP_TYPES[event.kind],
        appointmentId: event.appointmentId,
        payload: {
          kind: event.kind,
          actor: event.actor,
          customerName: event.customerName,
          serviceName: event.serviceName,
          barberName: event.barberName,
          startMs: event.startMs,
          endMs: event.endMs,
          cancelReason: event.cancelReason ?? null,
        },
      });
    } catch (error) {
      console.error("[notifications] in-app dispatch failed", error);
    }
  }

  if (!event.customerEmail) return;
  const locale = event.shop.defaultLocale;
  const rendered = renderAppointmentEmail(event, locale);
  let logId: string | null = null;
  try {
    logId = await queueEmail({
      shopId: event.shop.id,
      toEmail: event.customerEmail,
      template: rendered.template,
      payload: { subject: rendered.subject, locale },
    });
    const { provider, from } = resolveEmailChannel();
    await provider.send({
      from,
      to: event.customerEmail,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
    });
    await finalizeEmail(logId, "SENT");
  } catch (error) {
    console.error("[notifications] email dispatch failed", error);
    if (logId) {
      await finalizeEmail(logId, "FAILED", String((error as Error)?.message ?? error)).catch(
        () => {},
      );
    }
  }
}

/**
 * Convenience wrapper for action call sites: resolves the shop context
 * and completes the domain event with the shop identity. Keeps trigger
 * code at each call site down to one awaited line.
 */
export async function notifyAppointmentEvent(
  input: Omit<AppointmentEventData, "shop">,
): Promise<void> {
  const shop = await getShopContext();
  await dispatchAppointmentEvent({
    ...input,
    shop: {
      id: shop.id,
      name: shop.name,
      defaultLocale: shop.locale === "ne" ? "ne" : "en",
    },
  });
}
