import { translate } from "@/i18n/resolve";
import type { TranslationKey } from "@/i18n/types";
import type { Locale } from "@/i18n/config";
import { formatCurrency, formatDateTime } from "@/i18n/format";
import { resolveLocalizedText } from "@/i18n/localized-text";
import type { AppointmentEventData } from "./types";

/**
 * Pure email rendering: event data plus a locale in, message content
 * out. No IO and no request scope so it is trivially unit testable.
 * Layouts are inline styled; mail clients strip stylesheets.
 */

const SUBJECT_KEYS: Record<AppointmentEventData["kind"], TranslationKey> = {
  BOOKED: "email.bookedSubject",
  CONFIRMED: "email.confirmedSubject",
  CANCELLED: "email.cancelledSubject",
  RESCHEDULED: "email.rescheduledSubject",
};

const INTRO_KEYS: Record<AppointmentEventData["kind"], TranslationKey> = {
  BOOKED: "email.bookedBody",
  CONFIRMED: "email.confirmedBody",
  CANCELLED: "email.cancelledBody",
  RESCHEDULED: "email.rescheduledBody",
};

/** Stable identifier persisted to email_log.template. */
const TEMPLATE_IDS: Record<AppointmentEventData["kind"], string> = {
  BOOKED: "appointment_booked",
  CONFIRMED: "appointment_confirmed",
  CANCELLED: "appointment_cancelled",
  RESCHEDULED: "appointment_rescheduled",
};

export interface RenderedEmail {
  template: string;
  subject: string;
  html: string;
  text: string;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function renderRows(event: AppointmentEventData, locale: Locale): Array<[string, string]> {
  const rows: Array<[string, string]> = [
    [translate(locale, "email.service"), resolveLocalizedText(event.serviceName, locale) ?? ""],
    [translate(locale, "email.barber"), event.barberName],
    [translate(locale, "email.when"), formatDateTime(event.startMs, locale)],
    [translate(locale, "email.price"), formatCurrency(event.priceCents, locale)],
  ];
  if (event.kind === "CANCELLED" && event.cancelReason) {
    rows.push([translate(locale, "email.reason"), event.cancelReason]);
  }
  return rows.filter((row) => row[1] !== "");
}

export function renderAppointmentEmail(event: AppointmentEventData, locale: Locale): RenderedEmail {
  const subject = translate(locale, SUBJECT_KEYS[event.kind], {
    shopName: event.shop.name,
  });
  const intro = translate(locale, INTRO_KEYS[event.kind], {
    name: event.customerName,
    shopName: event.shop.name,
  });

  const rows = renderRows(event, locale);
  const text = [
    intro,
    "",
    ...rows.map(([label, value]) => `${label}: ${value}`),
    "",
    translate(locale, "email.footer", { shopName: event.shop.name }),
  ].join("\n");

  const rowsHtml = rows
    .map(
      ([label, value]) =>
        `<tr><td style="padding:6px 0;color:#78716c;font-size:13px;padding-right:24px;white-space:nowrap">${escapeHtml(label)}</td><td style="padding:6px 0;color:#1c1917;font-size:14px;font-weight:600">${escapeHtml(value)}</td></tr>`,
    )
    .join("");

  const html = `<div style="background:#f5f5f4;padding:32px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">
<div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e7e5e4">
<div style="background:#1c1917;padding:20px 28px"><span style="color:#ffffff;font-size:17px;font-weight:700;letter-spacing:-0.01em">${escapeHtml(event.shop.name)}</span></div>
<div style="padding:28px">
<h2 style="margin:0 0 12px;color:#1c1917;font-size:19px;line-height:1.3">${escapeHtml(subject)}</h2>
<p style="margin:0 0 20px;color:#44403c;font-size:14px;line-height:1.6">${escapeHtml(intro)}</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-top:1px solid #e7e5e4;padding-top:8px">${rowsHtml}</table>
</div>
<div style="padding:16px 28px;background:#fafaf9;border-top:1px solid #e7e5e4"><p style="margin:0;color:#a8a29e;font-size:12px;line-height:1.5">${escapeHtml(translate(locale, "email.footer", { shopName: event.shop.name }))}</p></div>
</div>
</div>`;

  return { template: TEMPLATE_IDS[event.kind], subject, html, text };
}
