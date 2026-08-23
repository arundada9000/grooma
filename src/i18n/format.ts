import { INTL_LOCALES, type Locale } from "./config";

/** The shop operates in Kathmandu; every formatted date uses this zone. */
export const SHOP_TIME_ZONE = "Asia/Kathmandu";

type DateInput = Date | string | number;

function toDate(input: DateInput): Date {
  return input instanceof Date ? input : new Date(input);
}

export function formatDate(
  input: DateInput,
  locale: Locale,
  options?: Intl.DateTimeFormatOptions,
): string {
  return new Intl.DateTimeFormat(INTL_LOCALES[locale], {
    timeZone: SHOP_TIME_ZONE,
    ...options,
  }).format(toDate(input));
}

export function formatTime(input: DateInput, locale: Locale): string {
  return formatDate(input, locale, { hour: "numeric", minute: "2-digit" });
}

export function formatDateTime(input: DateInput, locale: Locale): string {
  return formatDate(input, locale, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Amounts are stored as integer paisa; render NPR. */
export function formatCurrency(paisa: number, locale: Locale): string {
  return new Intl.NumberFormat(INTL_LOCALES[locale], {
    style: "currency",
    currency: "NPR",
  }).format(paisa / 100);
}

export function formatNumber(
  value: number,
  locale: Locale,
  options?: Intl.NumberFormatOptions,
): string {
  return new Intl.NumberFormat(INTL_LOCALES[locale], options).format(value);
}
