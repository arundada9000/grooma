"use server";

import { cookies } from "next/headers";
import { LOCALE_COOKIE } from "./config";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export async function persistLocale(locale: string) {
  const store = await cookies();
  store.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: ONE_YEAR_SECONDS,
    sameSite: "lax",
  });
}
