import { afterAll, beforeAll, describe, expect, it } from "vitest";
import postgres from "postgres";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import {
  appointments,
  barbers,
  customers,
  emailLog,
  notifications,
  services,
  shops,
  users,
} from "@/db/schema";
import {
  countUnreadNotifications,
  listNotificationsForUser,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/db/repositories/notifications";
import { dispatchAppointmentEvent } from "./service";

/**
 * Integration suite for the notification fan-out against the local
 * Postgres. Skips itself when the database is unreachable so unit runs
 * stay hermetic. Uses the console email provider implicitly: the test
 * env has no RESEND_API_KEY, so SENT rows prove the full lifecycle.
 */

const probe = process.env.DATABASE_URL
  ? postgres(process.env.DATABASE_URL, { prepare: false, max: 1, connect_timeout: 3 })
  : null;

async function databaseReachable(): Promise<boolean> {
  if (!probe) return false;
  try {
    await probe`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

describe.skipIf(!(await databaseReachable()))("notification dispatch integration", () => {
  let shopId = "";
  let ownerId = "";
  let appointmentId = "";

  beforeAll(async () => {
    expect(probe).not.toBeNull();
    const [shop] = await db
      .insert(shops)
      .values({
        slug: `test-notify-${Date.now()}`,
        name: "Notify Test Shop",
        contact: { phone: "+977-980-0000000" },
        location: { addressLine: "Test Marg 1", city: "Kathmandu", country: "Nepal" },
        social: {},
        branding: { presetId: "classic-barbershop" },
        bookingRules: {
          slotIntervalMinutes: 15,
          minNoticeMinutes: 0,
          maxAdvanceDays: 30,
          cancelDeadlineMinutes: 60,
          rescheduleDeadlineMinutes: 60,
        },
        homepage: { sections: [] },
        locale: "en",
        timezone: "Asia/Kathmandu",
        currency: "NPR",
      })
      .returning();
    shopId = shop.id;

    ownerId = `notify-owner-${Date.now()}`;
    await db.insert(users).values({
      id: ownerId,
      name: "Owner",
      email: `notify-owner-${Date.now()}@example.test`,
      emailVerified: true,
      role: "OWNER",
      shopId,
    });

    const [service] = await db
      .insert(services)
      .values({
        shopId,
        name: { en: "Haircut", ne: "कपाल काट्ने" },
        description: null,
        durationMinutes: 45,
        bufferMinutes: 0,
        priceCents: 45000,
        displayOrder: 1,
      })
      .returning();
    const [barber] = await db
      .insert(barbers)
      .values({ shopId, name: "Hari", displayName: "Hari", displayOrder: 1 })
      .returning();
    const [customer] = await db
      .insert(customers)
      .values({
        shopId,
        name: "Ram Bahadur",
        phone: "+9779801234567",
        email: "ram@example.com",
      })
      .returning();

    const [appointment] = await db
      .insert(appointments)
      .values({
        shopId,
        customerId: customer.id,
        barberId: barber.id,
        serviceId: service.id,
        startTime: new Date(Date.UTC(2026, 5, 1, 6, 0)),
        endTime: new Date(Date.UTC(2026, 5, 1, 6, 45)),
        status: "PENDING",
        source: "ONLINE",
        serviceNameSnapshot: service.name,
        barberNameSnapshot: barber.displayName,
        priceAtBookingCents: service.priceCents,
        durationAtBookingMinutes: service.durationMinutes,
        lookupTokenHash: "a".repeat(64),
      })
      .returning();
    appointmentId = appointment.id;
  });

  afterAll(async () => {
    // Shop cascade clears appointments, notifications and email_log.
    await db.delete(shops).where(eq(shops.id, shopId));
    await db.delete(users).where(eq(users.id, ownerId));
  });

  function baseEvent() {
    return {
      shop: { id: shopId, name: "Notify Test Shop", defaultLocale: "en" as const },
      appointmentId,
      serviceName: { en: "Haircut", ne: "कपाल काट्ने" },
      barberName: "Hari",
      startMs: Date.UTC(2026, 5, 1, 6, 0),
      endMs: Date.UTC(2026, 5, 1, 6, 45),
      priceCents: 45000,
      customerName: "Ram Bahadur",
      customerEmail: "ram@example.com" as string | null,
    };
  }

  it("fans a booked event out to owner inbox rows and a sent email log", async () => {
    await dispatchAppointmentEvent({ ...baseEvent(), kind: "BOOKED", actor: "CUSTOMER" });

    const inbox = await listNotificationsForUser(ownerId);
    expect(inbox).toHaveLength(1);
    expect(inbox[0].type).toBe("APPOINTMENT_BOOKED");
    expect(inbox[0].readAt).toBeNull();
    expect(inbox[0].appointmentId).toBe(appointmentId);
    expect(await countUnreadNotifications(ownerId)).toBe(1);

    const [log] = await db.select().from(emailLog).where(eq(emailLog.shopId, shopId));
    expect(log.status).toBe("SENT");
    expect(log.toEmail).toBe("ram@example.com");
    expect(log.template).toBe("appointment_booked");
    expect(log.error).toBeNull();
  });

  it("skips admin in-app rows for confirmations but still emails the customer", async () => {
    await dispatchAppointmentEvent({ ...baseEvent(), kind: "CONFIRMED", actor: "STAFF" });

    const inbox = await listNotificationsForUser(ownerId);
    expect(inbox.map((row) => row.type)).not.toContain("APPOINTMENT_CONFIRMED");

    const logs = await db.select().from(emailLog).where(eq(emailLog.shopId, shopId));
    expect(logs.some((log) => log.template === "appointment_confirmed")).toBe(true);
  });

  it("skips the email leg entirely without a recipient address", async () => {
    const logsBefore = (await db.select().from(emailLog).where(eq(emailLog.shopId, shopId))).length;
    await dispatchAppointmentEvent({
      ...baseEvent(),
      kind: "CANCELLED",
      actor: "STAFF",
      customerEmail: null,
    });
    const logsAfter = (await db.select().from(emailLog).where(eq(emailLog.shopId, shopId))).length;
    expect(logsAfter - logsBefore).toBe(0);

    // The in-app leg still ran for the cancellation.
    const inbox = await listNotificationsForUser(ownerId);
    expect(inbox.some((row) => row.type === "APPOINTMENT_CANCELLED")).toBe(true);
  });

  it("supports read state transitions end to end", async () => {
    await dispatchAppointmentEvent({ ...baseEvent(), kind: "RESCHEDULED", actor: "CUSTOMER" });

    const inbox = await listNotificationsForUser(ownerId);
    const target = inbox.find((row) => !row.readAt && row.type === "APPOINTMENT_RESCHEDULED");
    expect(target).toBeTruthy();

    expect(await markNotificationRead(ownerId, target!.id)).toBe(true);
    // Second mark is a no-op and reports as such.
    expect(await markNotificationRead(ownerId, target!.id)).toBe(false);

    await dispatchAppointmentEvent({ ...baseEvent(), kind: "BOOKED", actor: "STAFF" });
    await markAllNotificationsRead(ownerId);
    expect(await countUnreadNotifications(ownerId)).toBe(0);
  });

  it("dispatch always resolves, never throws at call sites", async () => {
    await expect(
      dispatchAppointmentEvent({ ...baseEvent(), kind: "BOOKED", actor: "CUSTOMER" }),
    ).resolves.toBeUndefined();
    const rows = await db.select().from(notifications).where(eq(notifications.shopId, shopId));
    expect(rows.length).toBeGreaterThan(0);
  });
});
