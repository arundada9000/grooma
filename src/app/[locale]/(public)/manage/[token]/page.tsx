import type { Metadata } from "next";
import Link from "next/link";
import { addDaysToDateKey, currentInstantMs, epochToZonedParts } from "@/lib/scheduling/format";
import { getLocale, getTranslator } from "@/i18n/server";
import type { Locale } from "@/i18n/config";
import { formatCurrency, formatDateTime, formatDate } from "@/i18n/format";
import { resolveLocalizedText } from "@/i18n/localized-text";
import { cn } from "@/lib/cn";
import { getShopContext } from "@/lib/tenant";
import { getManageModel } from "@/lib/booking/core";
import type { BookingErrorCode } from "@/lib/booking/types";
import { ManageActions } from "@/components/manage/manage-actions";

const CHUNK_DAYS = 7;
const MAX_PICKER_DAYS = 56;

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslator();
  return { title: t("manage.title") };
}

export default async function ManageAppointmentPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const [{ token }, shop, locale, { t }] = await Promise.all([
    params,
    getShopContext(),
    getLocale(),
    getTranslator(),
  ]);

  const model = await getManageModel(shop, token);

  if (model == null) {
    return (
      <div className="px-4 py-16 text-center">
        <p className="text-label text-lg font-semibold">{t("manage.notFound")}</p>
        <Link href={`/${locale}`} className="text-accent mt-4 inline-flex text-[15px] font-medium">
          {t("notFound.action")}
        </Link>
      </div>
    );
  }

  const { view, serviceId, barberId } = model;
  const activeStatus = view.status === "PENDING" || view.status === "CONFIRMED";
  const upcoming = view.startMs > currentInstantMs();
  const canModify = activeStatus && upcoming;

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
    generic: t("manage.error_GENERIC"),
  } satisfies Record<BookingErrorCode | "generic", string>;

  return (
    <div className="px-4 py-8">
      <h1 className="text-label text-[32px] font-semibold tracking-tight">{t("manage.title")}</h1>

      <div className="bg-card shadow-card ring-separator mt-6 rounded-2xl p-5 ring-1">
        <div className="flex items-center justify-between gap-3">
          <span
            className={cn(
              "inline-flex h-7 items-center rounded-full px-3 text-xs font-semibold tracking-wide uppercase",
              statusTone(view.status),
            )}
          >
            {t(`manage.status_${view.status}`)}
          </span>
          <span className="text-label-secondary text-sm tabular-nums">
            {formatDate(view.startMs, locale, { month: "short", day: "numeric" })}
          </span>
        </div>

        <dl className="divide-separator mt-4 divide-y">
          <Row term={t("manage.serviceLabel")}>
            {resolveLocalizedText(view.serviceName, locale as Locale)}
          </Row>
          <Row term={t("manage.barberLabel")}>{view.barberName}</Row>
          <Row term={t("manage.whenLabel")}>{formatDateTime(view.startMs, locale)}</Row>
          <Row term={t("manage.durationLabel")}>
            {t("manage.minutes", { minutes: view.durationMinutes })}
          </Row>
          <Row term={t("manage.priceLabel")}>
            <span className="text-accent font-semibold">
              {formatCurrency(view.priceCents, locale)}
            </span>
          </Row>
          {view.customerNotes ? (
            <Row term={t("manage.notesLabel")}>{view.customerNotes}</Row>
          ) : null}
        </dl>

        {canModify && model.cancelUntilMs != null ? (
          <p className="text-label-tertiary mt-4 text-[13px]">
            {t("manage.deadlineNote").replace(
              "{time}",
              formatDateTime(model.cancelUntilMs, locale),
            )}
          </p>
        ) : null}

        <ManageActions
          token={token}
          locale={locale as Locale}
          chunks={chunks}
          serviceId={serviceId}
          barberId={barberId}
          canModify={canModify}
          labels={{
            reschedule: t("manage.reschedule"),
            pickNewTime: t("book.pickTime"),
            confirmReschedule: t("book.confirmAndBook"),
            updating: t("book.confirming"),
            cancelBooking: t("manage.cancelBooking"),
            cancelConfirmTitle: t("manage.cancelConfirmTitle"),
            cancelConfirmBody: t("manage.cancelConfirmBody"),
            keepIt: t("manage.keepIt"),
            yesCancel: t("manage.yesCancel"),
            cancelling: t("manage.cancelling"),
            picker: {
              pickDate: t("book.pickDate"),
              pickTime: t("book.pickTime"),
              loadingTimes: t("book.loadingTimes"),
              noSlotsDay: t("book.noSlotsDay"),
              closedMark: t("book.closedMark"),
              laterDays: t("book.laterDays"),
              earlierDays: t("book.earlierDays"),
            },
            errorMessages: errorMessages as Record<BookingErrorCode | "generic", string>,
          }}
        />

        {activeStatus ? (
          <a
            href={`/api/manage/${token}/ics`}
            className="border-separator text-label mt-4 inline-flex h-11 items-center rounded-full border px-5 text-[15px] font-medium transition-transform duration-150 ease-out active:scale-[0.96]"
          >
            {t("manage.addCalendar")}
          </a>
        ) : null}
      </div>

      <Link
        href={`/${locale}/book`}
        className="text-accent mt-6 inline-flex text-[15px] font-medium"
      >
        {t("manage.bookAgain")}
      </Link>
    </div>
  );
}

function statusTone(status: string): string {
  switch (status) {
    case "CONFIRMED":
      return "bg-success/15 text-success";
    case "CANCELLED":
    case "NO_SHOW":
      return "bg-destructive/10 text-destructive";
    case "COMPLETED":
      return "bg-inset text-label-secondary";
    default:
      return "bg-warning/15 text-warning";
  }
}

function Row({ term, children }: { term: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2.5">
      <dt className="text-label-secondary shrink-0 pt-0.5 text-sm">{term}</dt>
      <dd className="text-label text-right text-[15px] font-medium">{children}</dd>
    </div>
  );
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
