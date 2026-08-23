import { createHash } from "node:crypto";
import { randomUUID } from "node:crypto";
import "@/db/env";
import { db } from "@/db";
import {
  appointments,
  barberServices,
  barbers,
  breaks,
  closures,
  customers,
  emailLog,
  notifications,
  services,
  shops,
  users,
  workingHours,
} from "@/db/schema";

const KTM_OFFSET = "+05:45";
const SHOP_SLUG = "demo-classic-barbershop";

/** Today in the shop timezone as YYYY-MM-DD. */
function kathmanduToday(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kathmandu" }).format(new Date());
}

function addDays(dateStr: string, days: number): string {
  const date = new Date(`${dateStr}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/** Wall-clock time in Kathmandu to an instant. */
function at(dateStr: string, time: string): Date {
  return new Date(`${dateStr}T${time}:00${KTM_OFFSET}`);
}

function lookupTokenHash(): string {
  return createHash("sha256").update(randomUUID()).digest("hex");
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
  }

  console.log("Seeding demo data...");

  await db.transaction(async (tx) => {
    // Dev seed resets all tenant data.
    await tx.delete(appointments);
    await tx.delete(notifications);
    await tx.delete(emailLog);
    await tx.delete(breaks);
    await tx.delete(closures);
    await tx.delete(workingHours);
    await tx.delete(barberServices);
    await tx.delete(barbers);
    await tx.delete(services);
    await tx.delete(customers);
    await tx.delete(users);
    await tx.delete(shops);

    const [shop] = await tx
      .insert(shops)
      .values({
        slug: SHOP_SLUG,
        name: "Demo Classic Barbershop",
        shortName: "Demo Classic",
        tagline: "Traditional craft, modern comfort.",
        description:
          "A friendly neighborhood barbershop in Butwal offering classic cuts, clean fades, and honest service.",
        contact: {
          phone: "+9779800000000",
          email: "hello@democlassic.test",
          whatsapp: "+9779800000000",
        },
        location: {
          addressLine: "Main Road, Traffic Chowk",
          city: "Butwal",
          province: "Lumbini Province",
          country: "Nepal",
          latitude: 27.7008,
          longitude: 83.4486,
        },
        social: {},
        branding: { presetId: "classic-barbershop" },
        homepage: {
          sections: [
            { type: "hero", enabled: true, content: {} },
            { type: "services", enabled: true, content: {} },
            { type: "barbers", enabled: true, content: {} },
            { type: "about", enabled: true, content: {} },
            { type: "opening-hours", enabled: true, content: {} },
            { type: "location", enabled: true, content: {} },
            { type: "contact", enabled: true, content: {} },
            { type: "booking-cta", enabled: true, content: {} },
            { type: "testimonials", enabled: false, content: {} },
            { type: "faq", enabled: false, content: {} },
          ],
        },
        bookingRules: {
          slotIntervalMinutes: 15,
          minNoticeMinutes: 30,
          maxAdvanceDays: 30,
          cancelDeadlineMinutes: 120,
          rescheduleDeadlineMinutes: 120,
        },
      })
      .returning();

    await tx.insert(users).values({
      shopId: shop.id,
      email: "owner@democlassic.test",
      name: "Shop Owner",
      role: "OWNER",
    });

    const serviceRows = await tx
      .insert(services)
      .values([
        {
          shopId: shop.id,
          name: { en: "Haircut", ne: "कपाल काट्ने" },
          description: {
            en: "Classic cut with a wash and finish.",
            ne: "धुने र स्टाइलसहित क्लासिक कपाल काट्ने।",
          },
          durationMinutes: 30,
          priceCents: 30000,
          displayOrder: 1,
        },
        {
          shopId: shop.id,
          name: { en: "Beard Trim", ne: "दाह्री मिलाउने" },
          description: {
            en: "Shape, line up, and oil finish.",
            ne: "आकार मिलाइएको र तेलसहित दाह्री।",
          },
          durationMinutes: 20,
          priceCents: 15000,
          displayOrder: 2,
        },
        {
          shopId: shop.id,
          name: { en: "Haircut + Beard", ne: "कपाल र दाह्री" },
          description: {
            en: "The full works in one chair.",
            ne: "एकै पटकमा पूरा सेवा।",
          },
          durationMinutes: 50,
          bufferMinutes: 10,
          priceCents: 40000,
          displayOrder: 3,
        },
        {
          shopId: shop.id,
          name: { en: "Hair Wash", ne: "कपाल धुने" },
          durationMinutes: 15,
          priceCents: 10000,
          displayOrder: 4,
        },
        {
          shopId: shop.id,
          name: { en: "Styling", ne: "स्टाइलिङ" },
          description: { en: "Occasion ready styling.", ne: "विशेष अवसरका लागि स्टाइलिङ।" },
          durationMinutes: 30,
          priceCents: 25000,
          displayOrder: 5,
        },
      ])
      .returning();

    const [haircut, beardTrim, combo, wash, styling] = serviceRows;

    const barberRows = await tx
      .insert(barbers)
      .values([
        {
          shopId: shop.id,
          name: "Bikash Shrestha",
          displayName: "Bikash",
          bio: {
            en: "Twelve years behind the chair, calm hands and sharp fades.",
            ne: "कुर्सी पछाडि बाह्र वर्ष, शान्त हात र तीखा फेडहरू।",
          },
          displayOrder: 1,
        },
        {
          shopId: shop.id,
          name: "Hari Gurung",
          displayName: "Hari",
          bio: {
            en: "Classic scissor work specialist.",
            ne: "क्लासिक सिसर कामका विज्ञ।",
          },
          displayOrder: 2,
        },
        {
          shopId: shop.id,
          name: "Anil Tamang",
          displayName: "Anil",
          bio: {
            en: "Beard shaping and hot towel rituals.",
            ne: "दाह्री आकार र हट तावल सेवा।",
          },
          displayOrder: 3,
        },
      ])
      .returning();

    const [bikash, hari, anil] = barberRows;

    // Every barber covers the core menu; extras vary.
    await tx.insert(barberServices).values([
      { barberId: bikash.id, serviceId: haircut.id },
      { barberId: bikash.id, serviceId: beardTrim.id },
      { barberId: bikash.id, serviceId: combo.id },
      { barberId: bikash.id, serviceId: wash.id },
      { barberId: bikash.id, serviceId: styling.id },
      { barberId: hari.id, serviceId: haircut.id },
      { barberId: hari.id, serviceId: beardTrim.id },
      { barberId: hari.id, serviceId: combo.id },
      { barberId: hari.id, serviceId: wash.id },
      { barberId: anil.id, serviceId: haircut.id },
      { barberId: anil.id, serviceId: beardTrim.id },
      { barberId: anil.id, serviceId: combo.id },
      { barberId: anil.id, serviceId: wash.id },
    ]);

    // Shop hours: Sunday through Friday, closed Saturday (Nepal weekly holiday).
    const shopHours = [0, 1, 2, 3, 4, 5].map((weekday) => ({
      shopId: shop.id,
      barberId: null,
      weekday,
      intervals: [{ start: "09:00", end: "18:00" }],
    }));
    await tx.insert(workingHours).values(shopHours);

    // Hari starts late: his day begins at 10:00.
    const hariHours = [0, 1, 2, 3, 4, 5].map((weekday) => ({
      shopId: shop.id,
      barberId: hari.id,
      weekday,
      intervals: [{ start: "10:00", end: "18:00" }],
    }));
    await tx.insert(workingHours).values(hariHours);

    // Daily lunch break across the shop.
    await tx.insert(breaks).values({
      shopId: shop.id,
      barberId: null,
      kind: "RECURRING",
      weekday: null,
      startTime: "13:00",
      endTime: "14:00",
      reason: "Lunch",
    });

    // A future public holiday closure.
    await tx.insert(closures).values({
      shopId: shop.id,
      barberId: null,
      startDate: addDays(kathmanduToday(), 21),
      endDate: addDays(kathmanduToday(), 21),
      fullDay: true,
      reason: "Public holiday",
    });

    const customerRows = await tx
      .insert(customers)
      .values([
        { shopId: shop.id, name: "Ramesh Karki", phone: "+9779811111111" },
        { shopId: shop.id, name: "Sita Adhikari", phone: "+9779822222222" },
        { shopId: shop.id, name: "Dipesh Thapa", phone: "+9779833333333" },
      ])
      .returning();

    const [ramesh, sita, dipesh] = customerRows;
    const today = kathmanduToday();

    await tx.insert(appointments).values([
      {
        shopId: shop.id,
        customerId: ramesh.id,
        barberId: bikash.id,
        serviceId: haircut.id,
        startTime: at(addDays(today, -1), "15:00"),
        endTime: at(addDays(today, -1), "15:30"),
        status: "COMPLETED",
        source: "ONLINE",
        serviceNameSnapshot: haircut.name,
        barberNameSnapshot: bikash.displayName,
        priceAtBookingCents: haircut.priceCents,
        durationAtBookingMinutes: haircut.durationMinutes,
        lookupTokenHash: lookupTokenHash(),
      },
      {
        shopId: shop.id,
        customerId: sita.id,
        barberId: anil.id,
        serviceId: beardTrim.id,
        startTime: at(today, "11:00"),
        endTime: at(today, "11:20"),
        status: "CONFIRMED",
        source: "ONLINE",
        serviceNameSnapshot: beardTrim.name,
        barberNameSnapshot: anil.displayName,
        priceAtBookingCents: beardTrim.priceCents,
        durationAtBookingMinutes: beardTrim.durationMinutes,
        lookupTokenHash: lookupTokenHash(),
      },
      {
        shopId: shop.id,
        customerId: dipesh.id,
        barberId: hari.id,
        serviceId: combo.id,
        startTime: at(addDays(today, 1), "11:00"),
        endTime: at(addDays(today, 1), "11:50"),
        status: "PENDING",
        source: "ONLINE",
        serviceNameSnapshot: combo.name,
        barberNameSnapshot: hari.displayName,
        priceAtBookingCents: combo.priceCents,
        durationAtBookingMinutes: combo.durationMinutes,
        customerNotes: "Prefers a fade.",
        lookupTokenHash: lookupTokenHash(),
      },
      {
        shopId: shop.id,
        customerId: ramesh.id,
        barberId: hari.id,
        serviceId: wash.id,
        startTime: at(addDays(today, -7), "12:00"),
        endTime: at(addDays(today, -7), "12:15"),
        status: "CANCELLED",
        cancelReason: "Customer cancelled",
        source: "ONLINE",
        serviceNameSnapshot: wash.name,
        barberNameSnapshot: hari.displayName,
        priceAtBookingCents: wash.priceCents,
        durationAtBookingMinutes: wash.durationMinutes,
        lookupTokenHash: lookupTokenHash(),
      },
    ]);
  });

  console.log("Seed complete.");
  console.log(`Demo shop slug: ${SHOP_SLUG}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  });
