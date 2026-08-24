import { afterAll, beforeAll, describe, expect, it } from "vitest";
import postgres from "postgres";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { barberServices, barbers, services, shops, workingHours } from "@/db/schema";
import type { Shop } from "@/db/schema";
import { addDaysToDateKey, weekdayOfDateKey } from "@/lib/scheduling/format";
import { createBookingCore, cancelByCustomerCore, lookupAppointmentCore } from "./core";

/**
 * Integration suite against the local Postgres (DATABASE_URL). Skips
 * itself when the database is unreachable so unit runs stay hermetic.
 * The concurrency case is the phase gate: two racing createBookingCore
 * calls on the same slot must yield exactly one winner; the loser gets
 * SLOT_UNAVAILABLE via the exclusion constraint (AD-03).
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

describe.skipIf(!(await databaseReachable()))("booking pipeline integration", () => {
  let shopId = "";
  let serviceId = "";
  let shopRow: Shop;

  const rules = {
    slotIntervalMinutes: 15,
    minNoticeMinutes: 0,
    maxAdvanceDays: 30,
    cancelDeadlineMinutes: 120,
    rescheduleDeadlineMinutes: 120,
    maxDailyBookingsPerCustomer: 2,
  };

  function shop(): Shop {
    return shopRow;
  }

  function futureMonday(): string {
    const today = new Date().toISOString().slice(0, 10);
    for (let offset = 2; offset <= 40; offset++) {
      const key = addDaysToDateKey(today, offset);
      if (weekdayOfDateKey(key) === 1) return key;
    }
    throw new Error("no Monday ahead");
  }

  beforeAll(async () => {
    expect(probe).not.toBeNull();
    const [inserted] = await db
      .insert(shops)
      .values({
        slug: `test-concurrency-${Date.now()}`,
        name: "Concurrency Test Shop",
        contact: { phone: "+977-980-0000000" },
        location: { addressLine: "Test Marg 1", city: "Kathmandu", country: "Nepal" },
        social: {},
        branding: { presetId: "classic-barbershop" },
        homepage: { sections: [] },
        bookingRules: rules,
        timezone: "Asia/Kathmandu",
        currency: "NPR",
        locale: "en",
      })
      .returning();

    shopId = inserted.id;
    shopRow = inserted;

    // Hours for every weekday keep dateKey math trivial.
    await db.insert(workingHours).values(
      [0, 1, 2, 3, 4, 5, 6].map((weekday) => ({
        shopId,
        barberId: null,
        weekday,
        intervals: [{ start: "09:00", end: "17:00" }],
      })),
    );

    const [service] = await db
      .insert(services)
      .values({
        shopId,
        name: { en: "Classic Cut" },
        durationMinutes: 30,
        bufferMinutes: 10,
        priceCents: 50000,
      })
      .returning({ id: services.id });
    serviceId = service.id;

    const barberRows = await db
      .insert(barbers)
      .values([
        { shopId, name: "Hari", displayName: "Hari" },
        { shopId, name: "Rama", displayName: "Rama" },
      ])
      .returning({ id: barbers.id });
    await db
      .insert(barberServices)
      .values(barberRows.map((barber) => ({ barberId: barber.id, serviceId })));
  });

  afterAll(async () => {
    if (shopId) {
      await db.delete(shops).where(eq(shops.id, shopId));
    }
    await probe?.end();
  });

  it("books with ANY assignment and exposes the view through the token", async () => {
    const result = await createBookingCore(shop(), {
      serviceId,
      barberId: "ANY",
      dateKey: futureMonday(),
      time: "10:00",
      customer: { name: "Integration Guest", phone: "+977-981-0000001" },
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const lookup = await lookupAppointmentCore(shop(), result.lookupToken);
    expect(lookup.ok).toBe(true);
    if (!lookup.ok) return;
    expect(lookup.appointment.status).toBe("PENDING");
    expect(lookup.appointment.serviceName.en).toBe("Classic Cut");
    expect(["Hari", "Rama"]).toContain(lookup.appointment.barberName);

    const cancel = await cancelByCustomerCore(shop(), { token: result.lookupToken });
    expect(cancel.ok).toBe(true);
    const again = await cancelByCustomerCore(shop(), { token: result.lookupToken });
    expect(again).toMatchObject({ ok: false, code: "STATE_CONFLICT" });
  });

  it("lets exactly one racer win the same slot", async () => {
    const input = {
      serviceId,
      barberId: "ANY",
      dateKey: futureMonday(),
      time: "11:00",
      customer: { name: "Race Guest", phone: "+977-981-0000002" },
    };

    const [a, b] = await Promise.all([
      createBookingCore(shop(), input),
      createBookingCore(shop(), input),
    ]);

    const winners = [a, b].filter((r) => r.ok);
    const losers = [a, b].filter((r) => !r.ok);
    expect(winners.length).toBe(1);
    for (const loser of losers) {
      expect(loser.code).toBe("SLOT_UNAVAILABLE");
    }
  });

  it("enforces max daily bookings per customer", async () => {
    const dayKey = futureMonday();
    const phone = "+977-981-0000003";
    for (const time of ["09:00", "13:00"]) {
      const attempt = await createBookingCore(shop(), {
        serviceId,
        barberId: "ANY",
        dateKey: dayKey,
        time,
        customer: { name: "Daily Limit Guest", phone },
      });
      expect(attempt.ok).toBe(true);
    }

    const third = await createBookingCore(shop(), {
      serviceId,
      barberId: "ANY",
      dateKey: dayKey,
      time: "15:00",
      customer: { name: "Daily Limit Guest", phone },
    });
    expect(third).toMatchObject({ ok: false, code: "MAX_DAILY_REACHED" });
  });
});
