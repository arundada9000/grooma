import { describe, expect, it } from "vitest";
import type { FaqItem } from "@/lib/validation/shop-config";
import {
  breadcrumbJsonLd,
  buildPageMetadata,
  faqJsonLd,
  localBusinessJsonLd,
  personItemListJsonLd,
  serviceItemListJsonLd,
} from "./profile";

const base = "https://grooma.example";
process.env.NEXT_PUBLIC_SITE_URL = base;

const business = {
  name: "Demo Classic Barbershop",
  tagline: "Traditional craft, modern comfort.",
  contact: { phone: "+977-1-5550000", email: "hi@example.com" },
  location: {
    addressLine: "Durbar Marg 12",
    city: "Kathmandu",
    country: "Nepal",
    latitude: 27.7172,
    longitude: 85.324,
  },
  social: { facebook: "https://facebook.example/demo", instagram: undefined },
  currency: "NPR",
};

describe("buildPageMetadata", () => {
  it("derives canonical, hreflang, OG and twitter from shop data", () => {
    const meta = buildPageMetadata({
      shopName: business.name,
      tagline: business.tagline,
      locale: "en",
      path: "/services",
      title: "Services",
    });

    expect(meta.title).toBe("Services");
    expect(meta.description).toBe(business.tagline);
    expect(meta.alternates?.canonical).toBe(`${base}/en/services`);
    expect(meta.alternates?.languages).toEqual({
      en: `${base}/en/services`,
      ne: `${base}/ne/services`,
    });
    const og = meta.openGraph as Record<string, unknown>;
    expect(og.siteName).toBe(business.name);
    expect(og.url).toBe(`${base}/en/services`);
    expect(og.locale).toBe("en");
    expect((meta.twitter as Record<string, unknown>).card).toBe("summary_large_image");
  });

  it("honors description overrides and noindex", () => {
    const meta = buildPageMetadata({
      shopName: business.name,
      locale: "ne",
      path: "/manage",
      title: "Manage",
      noindex: true,
    });
    expect(meta.description).toContain(business.name);
    expect(meta.robots).toEqual({ index: false, follow: false });
    // Root path canonicalizes without a double slash or trailing segment.
    const home = buildPageMetadata({ shopName: "X", locale: "en", path: "/", title: "Home" });
    expect(home.alternates?.canonical).toBe(`${base}/en`);
  });
});

describe("localBusinessJsonLd", () => {
  it("builds HairSalon with address, geo, sameAs and opening hours", () => {
    const ld = localBusinessJsonLd(
      business,
      [
        { weekday: 0, intervals: [{ start: "10:00", end: "18:00" }] },
        {
          weekday: 6,
          intervals: [
            { start: "09:00", end: "13:00" },
            { start: "14:00", end: "18:00" },
          ],
        },
      ],
      { siteUrl: base, locale: "en" },
    );

    expect(ld["@type"]).toBe("HairSalon");
    expect(ld.telephone).toBe("+977-1-5550000");
    expect(ld.priceRange).toBe("NPR");
    expect(ld.sameAs).toEqual(["https://facebook.example/demo"]);
    const address = ld.address as Record<string, unknown>;
    expect(address.addressLocality).toBe("Kathmandu");
    expect(ld.geo).toMatchObject({ latitude: 27.7172 });
    const hours = ld.openingHoursSpecification as Array<Record<string, unknown>>;
    expect(hours).toHaveLength(3);
    expect(hours[0]).toMatchObject({ dayOfWeek: "Sunday", opens: "10:00", closes: "18:00" });
    expect(hours[2].dayOfWeek).toBe("Saturday");
  });
});

describe("item lists", () => {
  it("maps services to Service items with resolved names and offers", () => {
    const ld = serviceItemListJsonLd(
      [{ id: "s1", name: { en: "Haircut", ne: "कट" }, description: null, priceCents: 45000 }],
      { locale: "ne", currency: "NPR", siteUrl: base },
    );
    const first = (ld.itemListElement as Array<Record<string, unknown>>)[0];
    const item = first.item as Record<string, unknown>;
    expect(item.name).toBe("कट");
    expect(item.offers).toMatchObject({ price: "450.00", priceCurrency: "NPR" });
  });

  it("maps barbers to Person items", () => {
    const ld = personItemListJsonLd(
      [{ displayName: "Hari", bio: { en: "Senior barber" }, photoUrl: null }],
      { locale: "en" },
    );
    const item = ((ld.itemListElement as Array<Record<string, unknown>>)[0].item ?? {}) as Record<
      string,
      unknown
    >;
    expect(item["@type"]).toBe("Person");
    expect(item.name).toBe("Hari");
    expect(item.description).toBe("Senior barber");
  });
});

describe("faqJsonLd", () => {
  it("resolves per-locale question and answer text", () => {
    const faqs: FaqItem[] = [
      {
        question: { en: "Do you take walk-ins?", ne: "" },
        answer: { en: "Yes, subject to availability.", ne: "" },
      },
    ];
    const en = faqJsonLd(faqs, "en") as { mainEntity: Array<Record<string, unknown>> };
    expect(en.mainEntity[0].name).toBe("Do you take walk-ins?");
    const answer = en.mainEntity[0].acceptedAnswer as Record<string, unknown>;
    expect(answer.text).toBe("Yes, subject to availability.");
  });
});

describe("breadcrumbJsonLd", () => {
  it("positions entries from one", () => {
    const ld = breadcrumbJsonLd([
      { name: "Home", url: `${base}/en` },
      { name: "Services", url: `${base}/en/services` },
    ]);
    const list = ld.itemListElement as Array<Record<string, unknown>>;
    expect(list.map((entry) => entry.position)).toEqual([1, 2]);
  });
});
