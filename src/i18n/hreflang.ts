import { LOCALES, type Locale } from "./config";

/**
 * Builds the languages map for Next.js metadata alternates. Input is a
 * locale-free path like "/style"; output maps every locale to its URL.
 * Pass a base URL to get absolute hreflang targets (recommended).
 */
export function buildAlternates(
  pathWithoutLocale: string,
  baseUrl?: string,
): { languages: Record<Locale, string> } {
  const normalized = pathWithoutLocale === "/" ? "" : pathWithoutLocale;
  const languages = Object.fromEntries(
    LOCALES.map((locale) => [locale, `${baseUrl ?? ""}/${locale}${normalized}`]),
  ) as Record<Locale, string>;
  return { languages };
}
