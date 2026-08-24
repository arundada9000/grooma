import { describe, expect, it } from "vitest";
import {
  availabilityQuerySchema,
  cancelBookingSchema,
  createBookingSchema,
  manageTokenSchema,
} from "./booking";

const SERVICE_ID = "11111111-1111-4111-8111-111111111111";
const BARBER_ID = "22222222-2222-4222-8222-222222222222";

describe("booking boundary schemas", () => {
  it("accepts a well formed booking with ANY barber", () => {
    const parsed = createBookingSchema.safeParse({
      serviceId: SERVICE_ID,
      barberId: "ANY",
      dateKey: "2026-09-07",
      time: "10:30",
      customer: { name: "Ram Bahadur", phone: "+977 980-1234567" },
      notes: "  fade please  ",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.notes).toBe("fade please");
  });

  it("rejects bad dates, times, phones, and selections", () => {
    const base = {
      serviceId: SERVICE_ID,
      barberId: BARBER_ID,
      customer: { name: "Ram", phone: "9801234567" },
    };
    for (const patch of [
      { dateKey: "2026-9-7" },
      { dateKey: "2026-02-30" },
      { time: "24:00" },
      { time: "10:60" },
      { customer: { name: "Ram", phone: "abc" } },
      { barberId: "not-a-uuid" },
    ]) {
      expect(createBookingSchema.safeParse({ ...base, ...patch }).success).toBe(false);
    }
  });

  it("caps the availability window at seven days", () => {
    const keys = Array.from({ length: 7 }, (_, i) => `2026-09-0${i + 1}`);
    expect(
      availabilityQuerySchema.safeParse({ serviceId: SERVICE_ID, dateKeys: keys.slice(0, 7) })
        .success,
    ).toBe(true);
    expect(
      availabilityQuerySchema.safeParse({
        serviceId: SERVICE_ID,
        dateKeys: [...keys, "2026-09-08"],
      }).success,
    ).toBe(false);
  });

  it("enforces the manage token shape", () => {
    expect(manageTokenSchema.safeParse("Abcdefghijklmnopqrst-_01").success).toBe(true);
    expect(manageTokenSchema.safeParse("short").success).toBe(false);
    expect(cancelBookingSchema.safeParse({ token: "short" }).success).toBe(false);
  });
});
