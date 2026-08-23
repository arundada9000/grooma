import { en, type Dictionary } from "./dictionaries/en";

export type { Dictionary };

/**
 * Dot path union of every leaf string in the dictionary, e.g. "signIn.email".
 * This gives compile-time key checking at every call site.
 */
export type TranslationKey = {
  [K in keyof Dictionary & string]: Dictionary[K] extends string
    ? K
    : `${K}.${TranslationKeyInner<Dictionary[K]>}`;
}[keyof Dictionary & string];

type TranslationKeyInner<T> = {
  [K in keyof T & string]: T[K] extends string ? K : `${K}.${TranslationKeyInner<T[K]>}`;
}[keyof T & string];

/** Partial at every level; the resolver falls through to English per key. */
export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends string ? T[K] : DeepPartial<T[K]>;
};

export type TranslateFn = (key: TranslationKey, vars?: Record<string, string | number>) => string;

export const ENGLISH_DICTIONARY = en;
