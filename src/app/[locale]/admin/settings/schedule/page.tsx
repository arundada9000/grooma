import type { Metadata } from "next";
import { getTranslator } from "@/i18n/server";
import { requireOwner } from "@/lib/auth/session";
import { getShopContext } from "@/lib/tenant";
import { listActiveBarbers } from "@/db/repositories/admin";
import { listBreaks, listClosures, listHoursForScope } from "@/db/repositories/shop-config";
import { BreaksClosures, HoursEditor } from "./schedule-client";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslator();
  return { title: t("admin.settings.cards.scheduleTitle") };
}

export default async function AdminScheduleSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ scope?: string }>;
}) {
  await requireOwner();
  const shop = await getShopContext();
  const { t } = await getTranslator();
  const params = await searchParams;

  const barbers = await listActiveBarbers(shop.id);
  const requestedScope = params.scope ?? "shop";
  const barberScope =
    requestedScope !== "shop" && barbers.some((barber) => barber.id === requestedScope)
      ? requestedScope
      : null;
  const scopeId = barberScope ?? "shop";

  const [hours, breaks, closures] = await Promise.all([
    listHoursForScope(shop.id, barberScope),
    listBreaks(shop.id),
    listClosures(shop.id),
  ]);

  const weekdayLabels = ["long0", "long1", "long2", "long3", "long4", "long5", "long6"] as const;
  const weekdays = [0, 1, 2, 3, 4, 5, 6].map((weekday) => ({
    weekday,
    label: t(`weekdays.${weekdayLabels[weekday]}`),
  }));

  return (
    <div>
      <h1 className="text-label text-[28px] font-semibold tracking-tight">
        {t("admin.settings.cards.scheduleTitle")}
      </h1>

      <nav className="mt-4 flex flex-wrap items-center gap-2">
        <span className="text-label-secondary text-[13px]">
          {t("admin.settings.schedule.scopeLabel")}:
        </span>
        <a
          href={`?scope=shop`}
          className={
            scopeId === "shop"
              ? "bg-accent-soft text-accent ring-accent/30 inline-flex h-8 items-center rounded-full px-3 text-[13px] font-medium ring-1"
              : "bg-inset text-label-secondary ring-separator inline-flex h-8 items-center rounded-full px-3 text-[13px] font-medium ring-1"
          }
        >
          {t("admin.settings.schedule.scopeShop")}
        </a>
        {barbers.map((barber) => (
          <a
            key={barber.id}
            href={`?scope=${barber.id}`}
            className={
              scopeId === barber.id
                ? "bg-accent-soft text-accent ring-accent/30 inline-flex h-8 items-center rounded-full px-3 text-[13px] font-medium ring-1"
                : "bg-inset text-label-secondary ring-separator inline-flex h-8 items-center rounded-full px-3 text-[13px] font-medium ring-1"
            }
          >
            {barber.displayName}
          </a>
        ))}
      </nav>

      <HoursEditor
        key={scopeId}
        barberId={barberScope}
        days={hours}
        weekdays={weekdays}
        labels={{
          save: t("admin.settings.save"),
          saving: t("admin.settings.saving"),
          saved: t("admin.settings.saved"),
          closed: t("admin.settings.schedule.closed"),
          addInterval: t("admin.settings.schedule.addInterval"),
          error_INVALID_INPUT: t("admin.settings.error_INVALID_INPUT"),
          error_GENERIC: t("admin.settings.error_GENERIC"),
        }}
      />

      <BreaksClosures
        breaks={breaks}
        closures={closures}
        barbers={[
          { id: null, label: t("admin.settings.schedule.barberAny") },
          ...barbers.map((barber) => ({ id: barber.id, label: barber.displayName })),
        ]}
        weekdays={weekdays}
        labels={{
          save: t("admin.settings.save"),
          saving: t("admin.settings.saving"),
          saved: t("admin.settings.saved"),
          add: t("admin.settings.add"),
          cancelLabel: t("admin.settings.cancel"),
          remove: t("admin.settings.remove"),
          confirmDelete: t("admin.settings.confirmDelete"),
          breaksTitle: t("admin.settings.schedule.breaksTitle"),
          breakRecurring: t("admin.settings.schedule.breakRecurring"),
          breakOneOff: t("admin.settings.schedule.breakOneOff"),
          weekdayLabel: t("admin.settings.schedule.weekday"),
          dateLabel: t("admin.settings.schedule.date"),
          timeRange: t("admin.settings.schedule.timeRange"),
          reason: t("admin.settings.schedule.reason"),
          addBreak: t("admin.settings.schedule.addBreak"),
          noBreaks: t("admin.settings.schedule.noBreaks"),
          closuresTitle: t("admin.settings.schedule.closuresTitle"),
          closureFullDay: t("admin.settings.schedule.closureFullDay"),
          closurePartial: t("admin.settings.schedule.closurePartial"),
          startDate: t("admin.settings.schedule.startDate"),
          endDate: t("admin.settings.schedule.endDate"),
          addClosure: t("admin.settings.schedule.addClosure"),
          noClosures: t("admin.settings.schedule.noClosures"),
          deleteBreak: t("admin.settings.schedule.deleteBreak"),
          deleteClosure: t("admin.settings.schedule.deleteClosure"),
          error_INVALID_INPUT: t("admin.settings.error_INVALID_INPUT"),
          error_GENERIC: t("admin.settings.error_GENERIC"),
        }}
      />
    </div>
  );
}
