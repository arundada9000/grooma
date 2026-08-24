import { describe, expect, it } from "vitest";
import { homepageConfigSchema, HOMEPAGE_SECTION_TYPES } from "./shop-config";
import { homepageConfigInputSchema } from "./admin";

describe("homepageConfigSchema", () => {
  it("accepts every section type with an empty content object", () => {
    const sections = HOMEPAGE_SECTION_TYPES.map((type) => ({ type, enabled: true, content: {} }));
    const result = homepageConfigSchema.safeParse({ sections });
    expect(result.success).toBe(true);
  });

  it("defaults content to an empty object when the key is missing", () => {
    const result = homepageConfigSchema.parse({ sections: [{ type: "hero", enabled: false }] });
    expect(result.sections[0].content).toEqual({});
  });

  it("keeps authored overrides for one section type", () => {
    const result = homepageConfigSchema.parse({
      sections: [
        {
          type: "hero",
          enabled: true,
          content: {
            headline: { en: "Fresh cuts", ne: "ताजा कट" },
            imageUrl: "https://cdn.example.test/hero.jpg",
          },
        },
      ],
    });
    const hero = result.sections[0];
    if (hero.type !== "hero") throw new Error("narrowing failed");
    expect(hero.content.headline).toEqual({ en: "Fresh cuts", ne: "ताजा कट" });
    expect(hero.content.imageUrl).toBe("https://cdn.example.test/hero.jpg");
  });

  it("strips unknown content keys instead of rejecting older rows", () => {
    const result = homepageConfigSchema.safeParse({
      sections: [{ type: "about", enabled: true, content: { body: { en: "Hi" }, legacy: "junk" } }],
    });
    expect(result.success).toBe(true);
  });

  it("rejects Nepali without English inside content text", () => {
    const result = homepageConfigSchema.safeParse({
      sections: [{ type: "booking-cta", enabled: true, content: { title: { ne: "बुक" } } }],
    });
    expect(result.success).toBe(false);
  });

  it("enforces repeater caps per section type", () => {
    const image = { url: "https://cdn.example.test/a.jpg" };
    for (const [type, cap] of [
      ["gallery", 12],
      ["why-us", 6],
      ["testimonials", 9],
      ["faq", 10],
    ] as const) {
      const item =
        type === "gallery"
          ? image
          : type === "testimonials"
            ? { quote: { en: "Great cut" }, author: "Arun" }
            : type === "faq"
              ? { question: { en: "Q?" }, answer: { en: "A." } }
              : { title: { en: "Fast" } };
      const over = homepageConfigSchema.safeParse({
        sections: [
          {
            type,
            enabled: true,
            content: { items: Array(cap + 1).fill(item), images: Array(cap + 1).fill(item) },
          },
        ],
      });
      expect(over.success).toBe(false);

      const atCap = homepageConfigSchema.safeParse({
        sections: [
          type === "gallery"
            ? { type, enabled: true, content: { images: Array(cap).fill(item) } }
            : { type, enabled: true, content: { items: Array(cap).fill(item) } },
        ],
      });
      expect(atCap.success).toBe(true);
    }
  });

  it("rejects repeater items missing their required text", () => {
    expect(
      homepageConfigSchema.safeParse({
        sections: [
          { type: "testimonials", enabled: true, content: { items: [{ author: "Arun" }] } },
        ],
      }).success,
    ).toBe(false);
    expect(
      homepageConfigSchema.safeParse({
        sections: [
          { type: "faq", enabled: true, content: { items: [{ question: { en: "Q?" } }] } },
        ],
      }).success,
    ).toBe(false);
  });
});

describe("homepageConfigInputSchema", () => {
  it("collapses blank localized fields to undefined", () => {
    const result = homepageConfigInputSchema.parse({
      sections: [
        {
          type: "booking-cta",
          enabled: true,
          content: { title: { en: "", ne: "" }, buttonLabel: { en: "Book" } },
        },
      ],
    });
    expect(result.sections[0].content).toEqual({ buttonLabel: { en: "Book" } });
  });

  it("drops whitespace-only English but rejects Nepali without English", () => {
    const dropped = homepageConfigInputSchema.safeParse({
      sections: [
        { type: "services", enabled: true, content: { title: { en: "   ", ne: "सेवा" } } },
      ],
    });
    expect(dropped.success).toBe(false);

    const kept = homepageConfigInputSchema.safeParse({
      sections: [{ type: "services", enabled: true, content: { title: { en: "Services" } } }],
    });
    expect(kept.success).toBe(true);
  });

  it("drops empty repeater rows and empties the list entirely when none remain", () => {
    const result = homepageConfigInputSchema.parse({
      sections: [
        {
          type: "faq",
          enabled: true,
          content: {
            items: [
              { question: { en: "", ne: "" }, answer: { en: "", ne: "" } },
              { question: { en: "Parking?" }, answer: { en: "Yes, out back." } },
            ],
          },
        },
        {
          type: "gallery",
          enabled: true,
          content: { images: [{ url: "", alt: { en: "" } }] },
        },
      ],
    });
    const faq = result.sections[0];
    if (faq.type !== "faq") throw new Error("narrowing failed");
    expect(faq.content.items).toHaveLength(1);
    const gallery = result.sections[1];
    if (gallery.type !== "gallery") throw new Error("narrowing failed");
    expect(gallery.content.images).toBeUndefined();
  });

  it("turns blank urls and ids into undefined and rejects junk ones", () => {
    const ok = homepageConfigInputSchema.safeParse({
      sections: [
        { type: "about", enabled: true, content: { imageUrl: "" } },
        { type: "featured-service", enabled: true, content: { serviceId: "   " } },
      ],
    });
    expect(ok.success).toBe(true);

    const badUrl = homepageConfigInputSchema.safeParse({
      sections: [{ type: "about", enabled: true, content: { imageUrl: "not a url" } }],
    });
    expect(badUrl.success).toBe(false);

    const badId = homepageConfigInputSchema.safeParse({
      sections: [{ type: "featured-service", enabled: true, content: { serviceId: "nope" } }],
    });
    expect(badId.success).toBe(false);
  });

  it("round trips: input output always satisfies the strict storage schema", () => {
    const raw = {
      sections: [
        {
          type: "hero",
          enabled: true,
          content: {
            headline: { en: "Fresh cuts", ne: "ताजा कट" },
            subheadline: { en: "", ne: "" },
            imageUrl: "",
            ctaLabel: { en: "Book" },
          },
        },
        {
          type: "testimonials",
          enabled: true,
          content: {
            items: [
              { quote: { en: "Best fade in town." }, author: "", role: { en: "Regular" } },
              { quote: { en: "Quick and clean." }, author: "Sabita", role: { en: "" } },
            ],
          },
        },
      ],
    };
    const parsed = homepageConfigInputSchema.parse(raw);
    expect(homepageConfigSchema.safeParse(parsed).success).toBe(true);
  });
});
