import type { Metadata } from "next";
import Link from "next/link";
import { getLocale, getTranslator } from "@/i18n/server";
import type { Locale } from "@/i18n/config";
import {
  addDaysToDateKey,
  currentInstantMs,
  epochToZonedParts,
  wallTimeToEpochMs,
} from "@/lib/scheduling/format";
import { formatDate, formatTime } from "@/i18n/format";
import { cn } from "@/lib/cn";
import { requireOwner } from "@/lib/auth/session";
import { getShopContext } from "@/lib/tenant";
import { listAppointmentsBetween, listUpcomingAppointments } from "@/db/repositories/admin";
import { AppointmentRow } from "@/components/admin/appointment-bits";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslator();
  return { title: t("admin.calendar.title") };
}

const VIEWS = ["day", "week", "list"] as const;
type View = (typeof VIEWS)[number];

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export default async function AdminCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; date?: string }>;
}) {
  const [session, locale, { t }, shop, params] = await Promise.all([
    requireOwner(),
    getLocale(),
    getTranslator(),
    getShopContext(),
    searchParams,
  ]);

  const view: View = VIEWS.includes(params.view as View) ? (params.view as View) : "day";
  const todayKey = epochToZonedParts(shop.timezone, currentInstantMs()).dateKey;
  const dateKey =
    params.date != null && DATE_KEY_PATTERN.test(params.date) ? params.date : todayKey;

  const viewLabels: Record<View, string> = {
    day: t("admin.calendar.viewDay"),
    week: t("admin.calendar.viewWeek"),
    list: t("admin.calendar.viewList"),
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-label text-[28px] font-semibold tracking-tight">
          {t("admin.calendar.title")}
        </h1>
        <div className="bg-inset flex rounded-full p-0.5">
          {VIEWS.map((candidate) => (
            <Link
              key={candidate}
              href={`/${locale}/admin/calendar?view=${candidate}&date=${dateKey}`}
              className={cn(
                "rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors",
                candidate === view
                  ? "bg-card text-label shadow-card"
                  : "text-label-secondary hover:text-label",
              )}
            >
              {viewLabels[candidate]}
            </Link>
          ))}
        </div>
      </div>

      {view === "day" ? (
        <DayView
          shopId={session.user.shopId}
          locale={locale}
          timezone={shop.timezone}
          dateKey={dateKey}
          todayKey={todayKey}
        />
      ) : view === "week" ? (
        <WeekView
          shopId={session.user.shopId}
          locale={locale}
          timezone={shop.timezone}
          dateKey={dateKey}
          todayKey={todayKey}
        />
      ) : (
        <ListView shopId={session.user.shopId} locale={locale} />
      )}
    </div>
  );
}

async function DayView({
  shopId,
  locale,
  timezone,
  dateKey,
  todayKey,
}: {
  shopId: string;
  locale: Locale;
  timezone: string;
  dateKey: string;
  todayKey: string;
}) {
  const { t } = await getTranslator();

  const start = wallTimeToEpochMs(timezone, dateKey, "00:00");
  const rows = await listAppointmentsBetween(shopId, start, start + 86_400_000);

  return (
    <>
      <DateNav locale={locale} view="day" dateKey={dateKey}>
        {formatDate(start, locale, { weekday: "long", month: "long", day: "numeric" })}
      </DateNav>
      {dateKey !== todayKey ? (
        <p className="mt-2 text-right">
          <Link href={`?view=day&date=${todayKey}`} className="text-accent text-[13px] font-medium">
            {t("admin.calendar.today")}
          </Link>
        </p>
      ) : null}
      <ul className="mt-4 space-y-2">
        {rows.length === 0 ? (
          <p className="text-label-tertiary py-6 text-sm">{t("admin.calendar.emptyDay")}</p>
        ) : (
          rows.map((row) => (
            <li key={row.id}>
              <AppointmentRow
                appointment={row}
                href={`/${locale}/admin/appointments/${row.id}`}
                locale={locale}
              />
            </li>
          ))
        )}
      </ul>
    </>
  );
}

async function WeekView({
  shopId,
  locale,
  timezone,
  dateKey,
  todayKey,
}: {
  shopId: string;
  locale: Locale;
  timezone: string;
  dateKey: string;
  todayKey: string;
}) {
  const { t } = await getTranslator();

  // Week starts on the Sunday of the anchor date.
  const anchorWeekday = epochToZonedParts(
    timezone,
    wallTimeToEpochMs(timezone, dateKey, "00:00"),
  ).weekday;
  const weekStartKey = addDaysToDateKey(dateKey, -anchorWeekday);
  const days = Array.from({ length: 7 }, (_, index) => addDaysToDateKey(weekStartKey, index));

  const perDay = await Promise.all(
    days.map(async (key) => {
      const start = wallTimeToEpochMs(timezone, key, "00:00");
      const rows = await listAppointmentsBetween(shopId, start, start + 86_400_000);
      return { key, start, rows };
    }),
  );

  const totalCount = perDay.reduce((sum, day) => sum + day.rows.length, 0);

  return (
    <>
      <DateNav locale={locale} view="week" dateKey={dateKey}>
        {formatDate(perDay[0].start, locale, { month: "short", day: "numeric" })} –{" "}
        {formatDate(perDay[6].start, locale, { month: "short", day: "numeric" })}
      </DateNav>
      <ul className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-7">
        {perDay.map(({ key, start, rows }) => {
          const isActive = key === todayKey;
          return (
            <li key={key}>
              <Link
                href={`?view=day&date=${key}`}
                className={cn(
                  "ring-separator bg-card hover:bg-inset block h-full rounded-2xl p-3 ring-1 transition-colors",
                  isActive && "ring-accent ring-[1.5px]",
                )}
              >
                <p className="text-label-secondary text-[11px] font-medium uppercase">
                  {formatDate(start, locale, { weekday: "short" })}
                </p>
                <p className="text-label mt-0.5 flex items-baseline gap-1.5 tabular-nums">
                  <span className="text-lg leading-none font-semibold">{rows.length}</span>
                </p>
                {rows.length > 0 ? (
                  <p className="text-label-tertiary mt-1 truncate text-[12px] tabular-nums">
                    {formatTime(rows[0].startMs, locale)}
                    {rows.length > 1
                      ? ` · ${t("admin.calendar.weekMore", { count: rows.length - 1 })}`
                      : ""}
                  </p>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
      {totalCount === 0 ? (
        <p className="text-label-tertiary mt-3 text-[13px]">{t("admin.calendar.emptyWeek")}</p>
      ) : null}
    </>
  );
}

async function ListView({ shopId, locale }: { shopId: string; locale: Locale }) {
  const { t } = await getTranslator();
  const rows = await listUpcomingAppointments(shopId, currentInstantMs(), 100);

  if (rows.length === 0) {
    return <p className="text-label-tertiary py-8 text-sm">{t("admin.calendar.emptyList")}</p>;
  }

  return (
    <ul className="mt-4 space-y-3">
      {rows.map((row) => (
        <li key={row.id}>
          <p className="text-label-secondary mb-1 pl-1 text-xs font-medium uppercase">
            {formatDate(row.startMs, locale, {
              weekday: "short",
              month: "short",
              day: "numeric",
            })}
          </p>
          <AppointmentRow
            appointment={row}
            href={`/${locale}/admin/appointments/${row.id}`}
            locale={locale}
          />
        </li>
      ))}
    </ul>
  );
}

function DateNav({
  locale,
  view,
  dateKey,
  children,
}: {
  locale: Locale;
  view: View;
  dateKey: string;
  children: React.ReactNode;
}) {
  void locale;
  return (
    <div className="mt-5 flex items-center justify-between gap-2">
      <Link
        href={`?view=${view}&date=${addDaysToDateKey(dateKey, -1)}`}
        aria-label="Previous"
        className="bg-inset text-label-secondary hover:bg-card flex h-9 w-9 items-center justify-center rounded-full transition-colors"
      >
        ‹
      </Link>
      <p className="text-label text-center text-[15px] font-semibold">{children}</p>
      <Link
        href={`?view=${view}&date=${addDaysToDateKey(dateKey, 1)}`}
        aria-label="Next"
        className="bg-inset text-label-secondary hover:bg-card flex h-9 w-9 items-center justify-center rounded-full transition-colors"
      >
        ›
      </Link>
    </div>
  );
}
