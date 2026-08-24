import { describe, expect, it } from "vitest";
import { renderAppointmentEmail } from "./templates";
import type { AppointmentEventData } from "./types";

function event(overrides?: Partial<AppointmentEventData>): AppointmentEventData {
  return {
    kind: "BOOKED",
    actor: "CUSTOMER",
    shop: { id: "shop-1", name: "Demo Classic Barbershop", defaultLocale: "en" },
    appointmentId: "appt-1",
    serviceName: { en: "Haircut", ne: "कपाल काट्ने" },
    barberName: "Hari Bahadur",
    startMs: Date.UTC(2026, 0, 15, 5, 30),
    endMs: Date.UTC(2026, 0, 15, 6, 0),
    priceCents: 50000,
    customerName: 'Ram <b>"&',
    customerEmail: "ram@example.com",
    ...overrides,
  };
}

describe("renderAppointmentEmail", () => {
  it("renders the English subject with the shop name interpolated", () => {
    const rendered = renderAppointmentEmail(event(), "en");
    expect(rendered.subject).toBe("Your appointment at Demo Classic Barbershop is booked");
    expect(rendered.template).toBe("appointment_booked");
  });

  it("renders Nepali templates and resolves localized service names", () => {
    const rendered = renderAppointmentEmail(event(), "ne");
    expect(rendered.subject).toBe("Demo Classic Barbershop मा तपाईंको अपोइन्टमेन्ट बुक भयो");
    expect(rendered.text).toContain("कपाल काट्ने");
  });

  it("maps every lifecycle kind to its own template id and subject", () => {
    const ids = (["BOOKED", "CONFIRMED", "CANCELLED", "RESCHEDULED"] as const).map(
      (kind) => renderAppointmentEmail(event({ kind }), "en").template,
    );
    expect(ids).toEqual([
      "appointment_booked",
      "appointment_confirmed",
      "appointment_cancelled",
      "appointment_rescheduled",
    ]);
    const subjects = new Set(
      (["BOOKED", "CONFIRMED", "CANCELLED", "RESCHEDULED"] as const).map(
        (kind) => renderAppointmentEmail(event({ kind }), "en").subject,
      ),
    );
    expect(subjects.size).toBe(4);
  });

  it("includes the cancel reason only for cancellations", () => {
    const cancelled = renderAppointmentEmail(
      event({ kind: "CANCELLED", cancelReason: "Out of town" }),
      "en",
    );
    expect(cancelled.text).toContain("Reason: Out of town");

    const booked = renderAppointmentEmail(event(), "en");
    expect(booked.text).not.toContain("Reason:");
  });

  it("escapes html metacharacters in the html leg only", () => {
    const rendered = renderAppointmentEmail(event(), "en");
    expect(rendered.html).not.toContain('Ram <b>"&');
    expect(rendered.html).toContain("&lt;b&gt;&quot;&amp;");
    expect(rendered.text).toContain('Ram <b>"&');
  });
});
