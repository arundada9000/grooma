"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { Locale } from "./config";
import { translate } from "./resolve";
import type { TranslateFn } from "./types";

const LocaleContext = createContext<Locale>("en");

export function LocaleProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}

export function useLocale(): Locale {
  return useContext(LocaleContext);
}

/** Translator bound to the locale provided by the nearest LocaleProvider. */
export function useT(): TranslateFn {
  const current = useLocale();
  return useMemo(() => (key, vars) => translate(current, key, vars), [current]);
}
