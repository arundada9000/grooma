export const LOCALES = ["en", "ne"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

/** Persisted user choice; the proxy reads it before Accept-Language. */
export const LOCALE_COOKIE = "grooma.locale";

/** Intl tags per locale. Nepali gets region formatting and Devanagari digits where natural. */
export const INTL_LOCALES: Record<Locale, string> = {
  en: "en",
  ne: "ne-NP",
};

export function isLocale(value: string | undefined | null): value is Locale {
  return (LOCALES as readonly string[]).includes(value ?? "");
}

/** First segment of a pathname like "/en/style". */
export function localeFromPathname(pathname: string): Locale | undefined {
  const first = pathname.split("/")[1];
  return isLocale(first) ? first : undefined;
}
