import type { Metadata } from "next";
import { getLocale, getTranslator } from "@/i18n/server";
import { requireOwner } from "@/lib/auth/session";
import {
  countUnreadNotifications,
  listNotificationsForUser,
} from "@/db/repositories/notifications";
import { formatDateTime } from "@/i18n/format";
import { resolveLocalizedText } from "@/i18n/localized-text";
import type { TranslationKey } from "@/i18n/types";
import type { LocalizedText } from "@/i18n/localized-text";
import { markAllReadAction, openNotificationAction } from "./actions";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslator();
  return { title: t("admin.notifications.title") };
}

/** Notification rows are written only by the notification service. */
const ITEM_KEYS: Record<string, TranslationKey> = {
  APPOINTMENT_BOOKED: "admin.notifications.itemBooked",
  APPOINTMENT_CONFIRMED: "admin.notifications.itemBooked",
  APPOINTMENT_CANCELLED: "admin.notifications.itemCancelled",
  APPOINTMENT_RESCHEDULED: "admin.notifications.itemRescheduled",
};

function payloadString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function payloadLocalized(value: unknown): LocalizedText | null {
  if (typeof value !== "object" || value === null) return null;
  const record = value as Record<string, unknown>;
  return typeof record.en === "string" ? (record as LocalizedText) : null;
}

function payloadNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export default async function AdminNotificationsPage() {
  const session = await requireOwner();
  const locale = await getLocale();
  const { t } = await getTranslator();

  const [rows, unreadCount] = await Promise.all([
    listNotificationsForUser(session.user.id),
    countUnreadNotifications(session.user.id),
  ]);

  return (
    <div>
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-label text-[28px] font-semibold tracking-tight">
            {t("admin.notifications.title")}
          </h1>
          <p className="text-label-secondary mt-0.5 text-sm">{t("admin.notifications.subtitle")}</p>
        </div>
        {unreadCount > 0 ? (
          <form action={markAllReadAction}>
            <button
              type="submit"
              className="border-separator text-label hover:bg-inset inline-flex h-9 items-center rounded-full border px-4 text-sm font-medium transition-colors"
            >
              {t("admin.notifications.markAllRead")}
            </button>
          </form>
        ) : null}
      </div>

      {rows.length === 0 ? (
        <p className="text-label-secondary bg-card shadow-card ring-separator mt-6 rounded-3xl p-8 text-center text-sm ring-1">
          {t("admin.notifications.empty")}
        </p>
      ) : (
        <ul className="mt-5 grid gap-2.5">
          {rows.map((row) => {
            const payload = row.payload as Record<string, unknown>;
            const serviceName =
              resolveLocalizedText(payloadLocalized(payload.serviceName), locale) ?? "";
            const customerName = payloadString(payload.customerName);
            const startMs = payloadNumber(payload.startMs);
            const via = payload.actor === "STAFF" ? t("admin.notifications.byStaff") : "";
            const titleKey = ITEM_KEYS[row.type] ?? "admin.notifications.itemBooked";
            const title = t(titleKey, { name: customerName, service: serviceName, via });
            const when = startMs != null ? formatDateTime(startMs, locale) : "";
            const barber = payloadString(payload.barberName);
            const isUnread = row.readAt == null;

            return (
              <li key={row.id}>
                <form action={openNotificationAction}>
                  <input type="hidden" name="id" value={row.id} />
                  <input type="hidden" name="appointmentId" value={row.appointmentId ?? ""} />
                  <button type="submit" className={cnRow(isUnread)}>
                    <span className="min-w-0 flex-1 text-left">
                      <span className={isUnread ? "font-semibold" : undefined}>{title}</span>
                      <span className="text-label-secondary mt-0.5 block truncate text-[13px]">
                        {[when, barber].filter(Boolean).join(" · ")}
                        {isUnread ? (
                          <span className="bg-accent-soft text-accent ml-2 inline-flex items-center rounded-full px-1.5 py-0.5 align-middle text-[10px] font-semibold tracking-wide uppercase">
                            {t("admin.notifications.unread")}
                          </span>
                        ) : null}
                      </span>
                    </span>
                    <span
                      aria-hidden="true"
                      className="text-label-tertiary pl-3 text-lg leading-none"
                    >
                      ›
                    </span>
                  </button>
                </form>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function cnRow(unread: boolean): string {
  return [
    "ring-separator shadow-card bg-card flex w-full items-center gap-1 rounded-2xl p-4 text-[15px] ring-1 text-left",
    "transition-transform duration-150 ease-out active:scale-[0.99]",
    unread ? "text-label" : "text-label-secondary",
  ].join(" ");
}
