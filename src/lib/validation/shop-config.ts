import { z } from "zod";

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

const homepageSectionSchema = z.object({
  type: z.enum(HOMEPAGE_SECTION_TYPES),
  enabled: z.boolean(),
  content: z.record(z.string(), z.unknown()).default({}),
});

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
