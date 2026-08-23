import { z } from "zod";

export const SUPPORTED_LOCALES = ["en", "ne"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

export function isLocale(value: string): value is Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

/**
 * Text authored by the shop in one or more languages.
 * English is required so the UI always has a fallback.
 */
export const localizedTextSchema = z.object({
  en: z.string().trim().min(1).max(500),
  ne: z.string().trim().min(1).max(500).optional(),
});

export type LocalizedText = z.infer<typeof localizedTextSchema>;

/**
 * Resolve display text for a locale with graceful fallback:
 * requested locale, then English, then null for empty input.
 */
export function resolveLocalizedText(
  value: LocalizedText | null | undefined,
  locale: Locale = DEFAULT_LOCALE,
): string | null {
  if (!value) return null;
  if (locale !== DEFAULT_LOCALE && value[locale]) {
    return value[locale] ?? value.en;
  }
  return value.en;
}
