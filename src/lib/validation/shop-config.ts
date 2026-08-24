import { z } from "zod";
import { localizedTextSchema } from "@/i18n/localized-text";

/**
 * Zod schemas for shop authored configuration stored in JSONB columns.
 * These shapes are the contract between the database, the admin editors,
 * and the public renderer. English strings are required inside
 * LocalizedText so every shop renders even with one language filled in.
 */

export const THEME_PRESET_IDS = [
  "classic-barbershop",
  "midnight",
  "minimal",
  "copper",
  "emerald",
  "ocean",
  "editorial",
] as const;

export const themePresetIdSchema = z.enum(THEME_PRESET_IDS);
export type ThemePresetId = (typeof THEME_PRESET_IDS)[number];

export const FONT_PAIRING_IDS = ["geist", "oswald-inter", "playfair-inter"] as const;

export const fontPairingIdSchema = z.enum(FONT_PAIRING_IDS);
export type FontPairingId = (typeof FONT_PAIRING_IDS)[number];

export const contactInfoSchema = z.object({
  phone: z.string().trim().min(3).max(32),
  email: z.email().max(255).optional(),
  whatsapp: z.string().trim().max(32).optional(),
  website: z.url().max(255).optional(),
});
export type ContactInfo = z.infer<typeof contactInfoSchema>;

export const locationInfoSchema = z.object({
  addressLine: z.string().trim().min(1).max(255),
  city: z.string().trim().min(1).max(120),
  province: z.string().trim().max(120).optional(),
  country: z.string().trim().min(1).max(120),
  postalCode: z.string().trim().max(20).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  mapsUrl: z.url().max(500).optional(),
});
export type LocationInfo = z.infer<typeof locationInfoSchema>;

export const socialLinksSchema = z.object({
  facebook: z.url().max(255).optional(),
  instagram: z.url().max(255).optional(),
  tiktok: z.url().max(255).optional(),
  twitter: z.url().max(255).optional(),
  youtube: z.url().max(255).optional(),
});
export type SocialLinks = z.infer<typeof socialLinksSchema>;

/** Keys the homepage theme builder lets shops override per scheme. */
const CUSTOM_COLOR_KEYS = [
  "background",
  "card",
  "inset",
  "label",
  "labelSecondary",
  "labelTertiary",
  "separator",
  "accent",
  "accentSoft",
  "onAccent",
] as const;

const cssColorSchema = z
  .string()
  .regex(/^(#[0-9a-fA-F]{3,8}|rgba?\(\s*[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+\s*(?:,\s*[\d.]+\s*)?\))$/)
  .max(64);

const colorOverrideShape = z.object(
  Object.fromEntries(CUSTOM_COLOR_KEYS.map((key) => [key, cssColorSchema.optional()])),
);

export const SCALE_STYLE_IDS = ["standard", "soft", "deep"] as const;

export const customThemeOverridesSchema = z.object({
  light: colorOverrideShape.optional(),
  dark: colorOverrideShape.optional(),
  style: z.enum(SCALE_STYLE_IDS).optional(),
});

export const brandingConfigSchema = z.object({
  presetId: themePresetIdSchema,
  fontPairing: fontPairingIdSchema.optional(),
  logoUrl: z.url().max(500).optional(),
  faviconUrl: z.url().max(500).optional(),
  customTheme: customThemeOverridesSchema.optional(),
});
export type BrandingConfig = z.infer<typeof brandingConfigSchema>;

export const HOMEPAGE_SECTION_TYPES = [
  "hero",
  "services",
  "featured-service",
  "barbers",
  "about",
  "why-us",
  "gallery",
  "testimonials",
  "faq",
  "opening-hours",
  "location",
  "contact",
  "booking-cta",
] as const;

/**
 * Per section type content. Every field is optional so an empty content
 * object is valid everywhere: sections fall back to shop columns, live
 * catalog data, and dictionary defaults when the owner authored nothing.
 * Unknown keys are stripped on parse, which keeps older rows loadable.
 */

const homepageImageSchema = z.object({
  url: z.url().max(500),
  alt: localizedTextSchema.optional(),
});
export type HomepageImage = z.infer<typeof homepageImageSchema>;

const headingOverrideSchema = z.object({
  title: localizedTextSchema.optional(),
  subtitle: localizedTextSchema.optional(),
});

export const heroContentSchema = z.object({
  headline: localizedTextSchema.optional(),
  subheadline: localizedTextSchema.optional(),
  imageUrl: z.url().max(500).optional(),
  ctaLabel: localizedTextSchema.optional(),
  secondaryCtaLabel: localizedTextSchema.optional(),
});
export type HeroContent = z.infer<typeof heroContentSchema>;

const servicesContentSchema = headingOverrideSchema;
export type ServicesContent = z.infer<typeof servicesContentSchema>;

export const featuredServiceContentSchema = z.object({
  serviceId: z.uuid().optional(),
  title: localizedTextSchema.optional(),
  subtitle: localizedTextSchema.optional(),
});
export type FeaturedServiceContent = z.infer<typeof featuredServiceContentSchema>;

const barbersContentSchema = headingOverrideSchema;
export type BarbersContent = z.infer<typeof barbersContentSchema>;

export const aboutContentSchema = z.object({
  body: localizedTextSchema.optional(),
  imageUrl: z.url().max(500).optional(),
});
export type AboutContent = z.infer<typeof aboutContentSchema>;

export const whyUsItemSchema = z.object({
  title: localizedTextSchema,
  description: localizedTextSchema.optional(),
});
export type WhyUsItem = z.infer<typeof whyUsItemSchema>;

const whyUsContentSchema = z.object({
  items: z.array(whyUsItemSchema).max(6).optional(),
});
export type WhyUsContent = z.infer<typeof whyUsContentSchema>;

const galleryContentSchema = z.object({
  images: z.array(homepageImageSchema).max(12).optional(),
});
export type GalleryContent = z.infer<typeof galleryContentSchema>;

export const testimonialItemSchema = z.object({
  quote: localizedTextSchema,
  author: z.string().trim().min(1).max(120),
  role: localizedTextSchema.optional(),
});
export type TestimonialItem = z.infer<typeof testimonialItemSchema>;

const testimonialsContentSchema = z.object({
  items: z.array(testimonialItemSchema).max(9).optional(),
});
export type TestimonialsContent = z.infer<typeof testimonialsContentSchema>;

export const faqItemSchema = z.object({
  question: localizedTextSchema,
  answer: localizedTextSchema,
});
export type FaqItem = z.infer<typeof faqItemSchema>;

const faqContentSchema = z.object({
  items: z.array(faqItemSchema).max(10).optional(),
});
export type FaqContent = z.infer<typeof faqContentSchema>;

const openingHoursContentSchema = headingOverrideSchema;
export type OpeningHoursContent = z.infer<typeof openingHoursContentSchema>;

const locationContentSchema = headingOverrideSchema;
export type LocationContent = z.infer<typeof locationContentSchema>;

const contactContentSchema = headingOverrideSchema;
export type ContactContent = z.infer<typeof contactContentSchema>;

export const bookingCtaContentSchema = z.object({
  title: localizedTextSchema.optional(),
  subtitle: localizedTextSchema.optional(),
  buttonLabel: localizedTextSchema.optional(),
});
export type BookingCtaContent = z.infer<typeof bookingCtaContentSchema>;

export const homepageSectionSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("hero"),
    enabled: z.boolean(),
    content: heroContentSchema.default({}),
  }),
  z.object({
    type: z.literal("services"),
    enabled: z.boolean(),
    content: servicesContentSchema.default({}),
  }),
  z.object({
    type: z.literal("featured-service"),
    enabled: z.boolean(),
    content: featuredServiceContentSchema.default({}),
  }),
  z.object({
    type: z.literal("barbers"),
    enabled: z.boolean(),
    content: barbersContentSchema.default({}),
  }),
  z.object({
    type: z.literal("about"),
    enabled: z.boolean(),
    content: aboutContentSchema.default({}),
  }),
  z.object({
    type: z.literal("why-us"),
    enabled: z.boolean(),
    content: whyUsContentSchema.default({}),
  }),
  z.object({
    type: z.literal("gallery"),
    enabled: z.boolean(),
    content: galleryContentSchema.default({}),
  }),
  z.object({
    type: z.literal("testimonials"),
    enabled: z.boolean(),
    content: testimonialsContentSchema.default({}),
  }),
  z.object({ type: z.literal("faq"), enabled: z.boolean(), content: faqContentSchema.default({}) }),
  z.object({
    type: z.literal("opening-hours"),
    enabled: z.boolean(),
    content: openingHoursContentSchema.default({}),
  }),
  z.object({
    type: z.literal("location"),
    enabled: z.boolean(),
    content: locationContentSchema.default({}),
  }),
  z.object({
    type: z.literal("contact"),
    enabled: z.boolean(),
    content: contactContentSchema.default({}),
  }),
  z.object({
    type: z.literal("booking-cta"),
    enabled: z.boolean(),
    content: bookingCtaContentSchema.default({}),
  }),
]);

export const homepageConfigSchema = z.object({
  sections: z.array(homepageSectionSchema),
});
export type HomepageConfig = z.infer<typeof homepageConfigSchema>;
export type HomepageSection = z.infer<typeof homepageSectionSchema>;

export const bookingRulesSchema = z.object({
  slotIntervalMinutes: z.number().int().min(5).max(60),
  minNoticeMinutes: z
    .number()
    .int()
    .min(0)
    .max(60 * 24 * 7),
  maxAdvanceDays: z.number().int().min(1).max(365),
  cancelDeadlineMinutes: z
    .number()
    .int()
    .min(0)
    .max(60 * 24 * 7),
  rescheduleDeadlineMinutes: z
    .number()
    .int()
    .min(0)
    .max(60 * 24 * 7),
  maxDailyBookingsPerCustomer: z.number().int().min(1).max(20).optional(),
});
export type BookingRules = z.infer<typeof bookingRulesSchema>;
