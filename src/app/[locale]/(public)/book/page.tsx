import type { Metadata } from "next";
import { addDaysToDateKey, currentInstantMs, epochToZonedParts } from "@/lib/scheduling/format";
import { getLocale, getTranslator } from "@/i18n/server";
import { resolveLocalizedText } from "@/i18n/localized-text";
import type { Locale } from "@/i18n/config";
import { getShopContext } from "@/lib/tenant";
import { buildPageMetadata } from "@/lib/seo/profile";
import { getActiveServices, getBarbersPerService } from "@/db/repositories/public";
import {
  BookingWizard,
  type WizardBarber,
  type WizardService,
} from "@/components/book/booking-wizard";
import type { BookingErrorCode } from "@/lib/booking/types";

/** Hard cap so a huge maxAdvanceDays cannot explode the picker payload. */
const MAX_PICKER_DAYS = 56;
const CHUNK_DAYS = 7;

export async function generateMetadata(): Promise<Metadata> {
  const [shop, locale, { t }] = await Promise.all([getShopContext(), getLocale(), getTranslator()]);
  return buildPageMetadata({
    shopName: shop.name,
    tagline: shop.tagline,
    locale,
    path: "/book",
    title: `${t("book.title")} — ${shop.name}`,
  });
}

export default async function BookPage({
  searchParams,
}: {
  searchParams: Promise<{ service?: string | string[]; barber?: string | string[] }>;
}) {
  const [shop, locale, { t }] = await Promise.all([getShopContext(), getLocale(), getTranslator()]);
  const params = await searchParams;

  const [services, barbersPerService] = await Promise.all([
    getActiveServices(shop.id),
    getBarbersPerService(shop.id),
  ]);
  const wizardServices: WizardService[] = services.map((service) => ({
    id: service.id,
    name: resolveLocalizedText(service.name, locale) ?? "",
    description: resolveLocalizedText(service.description, locale),
    durationMinutes: service.durationMinutes,
    priceCents: service.priceCents,
  }));
  const barbersByService: Record<string, WizardBarber[]> = {};
  for (const [serviceId, barbers] of barbersPerService) {
    barbersByService[serviceId] = barbers.map((barber) => ({
      id: barber.id,
      displayName: barber.displayName,
    }));
  }

  const requestedService = singleParam(params.service);
  const prefillServiceId =
    requestedService != null && services.some((service) => service.id === requestedService)
      ? requestedService
      : null;

  const requestedBarber = singleParam(params.barber);
  const prefillBarberId = (() => {
    if (requestedBarber === "ANY") return null;
    if (
      requestedBarber != null &&
      (prefillServiceId == null ||
        (barbersByService[prefillServiceId] ?? []).some((barber) => barber.id === requestedBarber))
    ) {
      return requestedBarber;
    }
    return null;
  })();

  const chunks = buildChunks(shop.timezone, shop.bookingRules.maxAdvanceDays);

  const errorMessages = {
    INVALID_INPUT: t("book.errors.INVALID_INPUT"),
    RATE_LIMITED: t("book.errors.RATE_LIMITED"),
    SERVICE_NOT_FOUND: t("book.errors.SERVICE_NOT_FOUND"),
    BARBER_NOT_FOUND: t("book.errors.BARBER_NOT_FOUND"),
    SLOT_UNAVAILABLE: t("book.errors.SLOT_UNAVAILABLE"),
    RULE_VIOLATION: t("book.errors.RULE_VIOLATION_MIN_NOTICE"),
    MAX_DAILY_REACHED: t("book.errors.MAX_DAILY_REACHED"),
    NOT_FOUND: t("book.errors.NOT_FOUND"),
    DEADLINE_PASSED: t("book.errors.DEADLINE_PASSED"),
    STATE_CONFLICT: t("book.errors.STATE_CONFLICT"),
    generic: t("book.errors.generic"),
  };

  return (
    <BookingWizard
      locale={locale as Locale}
      services={wizardServices}
      barbersByService={barbersByService}
      chunks={chunks}
      prefillServiceId={prefillServiceId}
      prefillBarberId={prefillBarberId}
      labels={{
        title: t("book.title"),
        progressLabel: t("book.progressLabel"),
        steps: [
          t("book.stepService"),
          t("book.stepBarber"),
          t("book.stepTime"),
          t("book.stepDetails"),
          t("book.stepReview"),
        ],
        chooseService: t("book.chooseService"),
        chooseBarber: t("book.chooseBarber"),
        anyBarber: t("book.anyBarber"),
        anyBarberHint: t("book.anyBarberHint"),
        yourDetails: t("book.yourDetails"),
        name: t("book.name"),
        namePlaceholder: t("book.namePlaceholder"),
        phone: t("book.phone"),
        phonePlaceholder: t("book.phonePlaceholder"),
        email: t("book.email"),
        emailOptional: t("book.emailOptional"),
        notes: t("book.notes"),
        notesOptional: t("book.notesOptional"),
        notesPlaceholder: t("book.notesPlaceholder"),
        review: t("book.review"),
        serviceLabel: t("book.serviceLabel"),
        barberLabel: t("book.barberLabel"),
        whenLabel: t("book.whenLabel"),
        priceLabel: t("book.priceLabel"),
        confirmAndBook: t("book.confirmAndBook"),
        back: t("book.back"),
        next: t("book.next"),
        edit: t("book.edit"),
        confirming: t("book.confirming"),
        confirmed: t("book.confirmed"),
        confirmedSubtitle: t("book.confirmedSubtitle"),
        addToCalendar: t("book.addToCalendar"),
        manageBooking: t("book.manageBooking"),
        conflictTitle: t("book.conflictTitle"),
        conflictMessage: t("book.conflictMessage"),
        invalidField: t("book.errors.INVALID_INPUT"),
        picker: {
          pickDate: t("book.pickDate"),
          pickTime: t("book.pickTime"),
          loadingTimes: t("book.loadingTimes"),
          noSlotsDay: t("book.noSlotsDay"),
          closedMark: t("book.closedMark"),
          laterDays: t("book.laterDays"),
          earlierDays: t("book.earlierDays"),
        },
        errorMessages: errorMessages satisfies Record<BookingErrorCode | "generic", string>,
        ruleViolations: {
          PAST: t("book.errors.RULE_VIOLATION_PAST"),
          MIN_NOTICE: t("book.errors.RULE_VIOLATION_MIN_NOTICE"),
          MAX_ADVANCE: t("book.errors.RULE_VIOLATION_MAX_ADVANCE"),
        },
      }}
    />
  );
}

function singleParam(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function buildChunks(timezone: string, maxAdvanceDays: number): string[][] {
  const todayKey = epochToZonedParts(timezone, currentInstantMs()).dateKey;
  const totalDays = Math.min(maxAdvanceDays + 1, MAX_PICKER_DAYS);
  const keys: string[] = [];
  for (let offset = 0; offset < totalDays; offset += 1) {
    keys.push(addDaysToDateKey(todayKey, offset));
  }
  const chunks: string[][] = [];
  for (let index = 0; index < keys.length; index += CHUNK_DAYS) {
    chunks.push(keys.slice(index, index + CHUNK_DAYS));
  }
  return chunks;
}
