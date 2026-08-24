import type { LocalizedText } from "@/i18n/localized-text";
import type { Locale } from "@/i18n/config";

/**
 * Contract between the lifecycle call sites and the notification
 * service. Callers describe WHAT happened in domain terms; providers
 * and rendering details stay behind the service boundary (spec 35).
 */

export type AppointmentEventKind = "BOOKED" | "CONFIRMED" | "CANCELLED" | "RESCHEDULED";

export type EventActor = "CUSTOMER" | "STAFF";

export interface AppointmentEventData {
  kind: AppointmentEventKind;
  /** Who drove the change; emails phrase themselves accordingly. */
  actor: EventActor;
  shop: {
    id: string;
    name: string;
    /** Emails use the shop default locale until recipients have accounts. */
    defaultLocale: Locale;
  };
  appointmentId: string;
  /** Historical snapshots; never re-read live catalog data here. */
  serviceName: LocalizedText;
  barberName: string;
  startMs: number;
  endMs: number;
  priceCents: number;
  customerName: string;
  /** Optional at booking; no address means the email leg is skipped. */
  customerEmail: string | null;
  cancelReason?: string | null;
}

export interface EmailMessage {
  from: string;
  to: string;
  subject: string;
  html: string;
  text: string;
}

/** Transport seam: console today in dev, Resend in production, SMS later. */
export interface EmailProvider {
  readonly name: string;
  send(message: EmailMessage): Promise<void>;
}
