import { en as ENGLISH_DICTIONARY } from "./dictionaries/en";
import { ne } from "./dictionaries/ne";
import type { TranslationKey } from "./types";

const dictionaries: Record<string, unknown> = {
  en: ENGLISH_DICTIONARY,
  ne,
};

function getAtPath(source: unknown, path: string): string | undefined {
  let current: unknown = source;
  for (const segment of path.split(".")) {
    if (typeof current !== "object" || current === null) {
      return undefined;
    }
    current = (current as Record<string, unknown>)[segment];
  }
  return typeof current === "string" ? current : undefined;
}

/**
 * Resolves a key against the locale dictionary first, then English.
 * Unknown keys return the key itself so a missing translation can never
 * render as an empty node. Interpolates {name} placeholders.
 */
export function translate(
  locale: string,
  key: TranslationKey,
  vars?: Record<string, string | number>,
): string {
  let value = getAtPath(dictionaries[locale], key) ?? getAtPath(ENGLISH_DICTIONARY, key);
  if (!value) {
    return key;
  }
  if (vars) {
    for (const [name, replacement] of Object.entries(vars)) {
      value = value.replaceAll(`{${name}}`, String(replacement));
    }
  }
  return value;
}
