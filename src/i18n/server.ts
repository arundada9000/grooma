import "server-only";

import { notFound } from "next/navigation";
import { locale } from "next/root-params";
import type { Locale } from "./config";
import { isLocale } from "./config";
import { translate } from "./resolve";
import type { TranslateFn, TranslationKey } from "./types";

/**
 * Resolves the locale from the [locale] root segment. Unknown locales 404
 * instead of throwing. Server Components and server utilities only; the
 * next/root-params import fails the build if this ever lands in a client
 * bundle.
 */
export async function getLocale(): Promise<Locale> {
  const value = await locale();
  if (!isLocale(value)) {
    notFound();
  }
  return value;
}

/** Translator bound to the current route's locale. */
export async function getTranslator(): Promise<{ locale: Locale; t: TranslateFn }> {
  const current = await getLocale();
  return {
    locale: current,
    t: (key: TranslationKey, vars?: Record<string, string | number>) =>
      translate(current, key, vars),
  };
}
