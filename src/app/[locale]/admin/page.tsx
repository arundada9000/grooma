import type { Metadata } from "next";
import { getLocale, getTranslator } from "@/i18n/server";
import { formatCurrency, formatDateTime, formatDate, formatTime } from "@/i18n/format";
import { currentInstantMs, epochToZonedParts, wallTimeToEpochMs } from "@/lib/scheduling/format";
import { requireOwner } from "@/lib/auth/session";
import { getShopContext } from "@/lib/tenant";
import { listAppointmentsBetween, listUpcomingAppointments } from "@/db/repositories/admin";
import { AppointmentRow, SectionCard } from "@/components/admin/appointment-bits";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslator();
  return { title: t("admin.dashboardTitle") };
}

export default async function AdminDashboardPage() {
  await requireOwner();
  const locale = await getLocale();
  const { t } = await getTranslator();
  const shop = await getShopContext();

  const nowMs = currentInstantMs();
  const todayKey = epochToZonedParts(shop.timezone, nowMs).dateKey;
  const dayStart = wallTimeToEpochMs(shop.timezone, todayKey, "00:00");
  const dayEnd = dayStart + 86_400_000;

  const [today, upcoming] = await Promise.all([
    listAppointmentsBetween(shop.id, dayStart, dayEnd),
    listUpcomingAppointments(shop.id, nowMs, 5),
  ]);

  const active = today.filter((row) => row.status === "PENDING" || row.status === "CONFIRMED");
  const completed = today.filter((row) => row.status === "COMPLETED");
  const expectedRevenue = [...active, ...completed].reduce((sum, row) => sum + row.priceCents, 0);

  const nextUp = upcoming[0] ?? null;

  // Pending starts within the warning window (or already started).
  const WARN_WINDOW_MS = 3 * 3_600_000;
  const warnings = today.filter(
    (row) => row.status === "PENDING" && row.startMs - nowMs < WARN_WINDOW_MS,
  );

  return (
    <div>
      <h1 className="text-label text-[28px] font-semibold tracking-tight">
        {t("admin.dashboardTitle")}
      </h1>
      <p className="text-label-secondary mt-0.5 text-sm">
        {formatDate(nowMs, locale, { weekday: "long", month: "long", day: "numeric" })}
      </p>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label={t("admin.stats.today")} value={String(today.length)} />
        <Stat
          label={t("admin.stats.pending")}
          value={String(today.filter((row) => row.status === "PENDING").length)}
          tone={today.some((row) => row.status === "PENDING") ? "warning" : undefined}
        />
        <Stat
          label={t("admin.stats.revenueToday")}
          value={formatCurrency(expectedRevenue, locale)}
        />
        <Stat label={t("admin.stats.completedToday")} value={String(completed.length)} />
      </div>

      <SectionCard title={t("admin.nextUp.title")}>
        {nextUp == null ? (
          <p className="text-label-tertiary text-sm">{t("admin.nextUp.none")}</p>
        ) : (
          <div className="space-y-2">
            <AppointmentRow
              appointment={nextUp}
              href={`/${locale}/admin/appointments/${nextUp.id}`}
              locale={locale}
            />
            <p className="text-label-tertiary pl-1 text-[13px]">
              {formatDateTime(nextUp.startMs, locale)}
            </p>
          </div>
        )}
      </SectionCard>

      {warnings.length > 0 ? (
        <SectionCard title={t("admin.warnings.title")}>
          <ul className="bg-warning/10 ring-warning/30 space-y-2 rounded-2xl p-4 ring-1">
            {warnings.map((row) => (
              <li key={row.id} className="text-[15px]">
                <span className="font-medium">
                  {row.customerName} · {row.serviceName.en}
                </span>{" "}
                <span className="text-label-secondary">{formatTime(row.startMs, locale)}</span>
              </li>
            ))}
          </ul>
        </SectionCard>
      ) : null}

      <SectionCard title={t("admin.todayList.title")}>
        {today.length === 0 ? (
          <p className="text-label-tertiary text-sm">{t("admin.todayList.empty")}</p>
        ) : (
          <ul className="space-y-2">
            {today.map((row) => (
              <li key={row.id}>
                <AppointmentRow
                  appointment={row}
                  href={`/${locale}/admin/appointments/${row.id}`}
                  locale={locale}
                />
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "warning" }) {
  return (
    <div className="bg-card shadow-card ring-separator rounded-2xl p-4 ring-1">
      <p className="text-label-secondary truncate text-xs">{label}</p>
      <p
        className={
          tone === "warning"
            ? "text-warning mt-1 text-xl font-semibold tabular-nums"
            : "text-label mt-1 text-xl font-semibold tabular-nums"
        }
      >
        {value}
      </p>
    </div>
  );
}
