import { getShopContext } from "@/lib/tenant";
import { getManageModel } from "@/lib/booking/core";

/**
 * Calendar invite for a customer's appointment. Token in the path is
 * the capability: no other auth, but the shop boundary is still checked.
 */

function icsEscape(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

/** Basic UTC format (YYYYMMDDTHHMMSSZ) required by RFC 5545. */
function icsUtc(ms: number): string {
  return `${new Date(ms)
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "")}`;
}

export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!/^[A-Za-z0-9_-]{20,100}$/.test(token)) {
    return new Response("Not found", { status: 404 });
  }

  const shop = await getShopContext();
  const model = await getManageModel(shop, token);
  if (model == null) {
    return new Response("Not found", { status: 404 });
  }
  if (model.view.status === "CANCELLED") {
    return new Response("Gone", { status: 410 });
  }

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Grooma//Appointment//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${icsUid(token)}`,
    `DTSTAMP:${icsUtc(Date.now())}`,
    `DTSTART:${icsUtc(model.view.startMs)}`,
    `DTEND:${icsUtc(model.view.endMs)}`,
    `SUMMARY:${icsEscape(`${model.view.serviceName.en} @ ${shop.name}`)}`,
    `LOCATION:${icsEscape(
      [shop.location.addressLine, shop.location.city, shop.location.country].join(", "),
    )}`,
    `DESCRIPTION:${icsEscape(
      [
        `Barber: ${model.view.barberName}`,
        model.view.customerNotes ? `Notes: ${model.view.customerNotes}` : null,
        `Phone: ${shop.contact.phone}`,
      ]
        .filter(Boolean)
        .join("\n"),
    )}`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return new Response(lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="appointment.ics"',
      "Cache-Control": "no-store",
    },
  });
}

/** Stable event id derived from the token so updates dedupe. */
function icsUid(token: string): string {
  let hash = 0;
  for (const char of token) {
    hash = (hash * 31 + char.charCodeAt(0)) | 0;
  }
  return `appointment-${(hash >>> 0).toString(36)}@grooma`;
}
