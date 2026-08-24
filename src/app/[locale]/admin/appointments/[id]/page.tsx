import type { Metadata } from "next";
import Link from "next/link";
import { addDaysToDateKey, currentInstantMs, epochToZonedParts } from "@/lib/scheduling/format";
import { getLocale, getTranslator } from "@/i18n/server";
import type { Locale } from "@/i18n/config";
import { formatCurrency, formatDate, formatDateTime, formatTime } from "@/i18n/format";
import { resolveLocalizedText } from "@/i18n/localized-text";
import { cn } from "@/lib/cn";
import { requireOwner } from "@/lib/auth/session";
import { getShopContext } from "@/lib/tenant";
import { getAppointmentDetail } from "@/db/repositories/admin";
import { AdminNotesEditor, AppointmentActions } from "@/components/admin/appointment-actions";

const CHUNK_DAYS = 7;
const MAX_PICKER_DAYS = 56;

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslator();
  return { title: t("admin.appointment.title") };
}

export default async function AdminAppointmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [session, shop, locale, { t }, { id }] = await Promise.all([
    requireOwner(),
    getShopContext(),
    getLocale(),
    getTranslator(),
    params,
  ]);

  const detail = await getAppointmentDetail(session.user.shopId, id);
  if (detail == null) {
    return (
      <NotFound
        locale={locale}
        label={t("admin.appointment.notFound")}
        action={t("admin.appointment.backToCalendar")}
      />
    );
  }

  const chunks = buildChunks(shop.timezone, MAX_PICKER_DAYS);

  return (
    <div>
      <Link href={`/${locale}/admin/calendar`} className="text-accent text-sm font-medium">
        ← {t("admin.appointment.backToCalendar")}
      </Link>

      <h1 className="text-label mt-3 text-[26px] font-semibold tracking-tight">
        {detail.customerName}
      </h1>
      <p className="text-label-secondary mt-0.5 text-sm tabular-nums">
        {formatDateTime(detail.startMs, locale)}
      </p>

      <dl className="bg-card shadow-card ring-separator mt-5 divide-y rounded-2xl p-5 ring-1">
        <Row term={t("admin.list.status")}>
          <span
            className={cn(
              "inline-flex h-7 items-center rounded-full px-3 text-xs font-semibold tracking-wide uppercase",
              statusTone(detail.status),
            )}
          >
            {t(`manage.status_${detail.status}`)}
          </span>
        </Row>
        <Row term={t("admin.appointment.serviceLabel")}>
          {resolveLocalizedText(detail.serviceName, locale)}
        </Row>
        <Row term={t("admin.appointment.barberLabel")}>{detail.barberName}</Row>
        <Row term={t("admin.appointment.whenLabel")}>
          {formatDate(detail.startMs, locale, { month: "long", day: "numeric" })} ·{" "}
          {formatTime(detail.startMs, locale)} – {formatTime(detail.endMs, locale)}
        </Row>
        <Row term={t("admin.appointment.durationLabel")}>
          {t("admin.appointment.minutes", { minutes: detail.durationMinutes })}
        </Row>
        <Row term={t("admin.appointment.priceLabel")}>
          <span className="text-accent font-semibold">
            {formatCurrency(detail.priceCents, locale)}
          </span>
        </Row>
        <Row term={t("admin.appointment.sourceLabel")}>
          {t(
            detail.source === "ONLINE"
              ? "admin.appointment.source_ONLINE"
              : detail.source === "ADMIN"
                ? "admin.appointment.source_ADMIN"
                : "admin.appointment.source_WALK_IN",
          )}
        </Row>
        <Row term={t("admin.appointment.phoneLabel")}>
          <a
            href={`tel:${detail.customerPhone.replace(/[^+\d]/g, "")}`}
            className="hover:text-accent transition-colors"
          >
            {detail.customerPhone}
          </a>
        </Row>
        {detail.customerEmail ? (
          <Row term={t("admin.appointment.emailLabel")}>{detail.customerEmail}</Row>
        ) : null}
        {detail.customerNotes ? (
          <Row term={t("manage.notesLabel")}>{detail.customerNotes}</Row>
        ) : null}
        {detail.cancelReason ? (
          <Row term={t("manage.cancelledBanner")}>{detail.cancelReason}</Row>
        ) : null}
      </dl>

      <AppointmentActions
        appointmentId={detail.id}
        locale={locale as Locale}
        status={detail.status}
        serviceId={detail.serviceId}
        barberId={detail.barberId}
        chunks={chunks}
        labels={{
          confirm: t("admin.appointment.confirm"),
          complete: t("admin.appointment.complete"),
          cancelAction: t("admin.appointment.cancelAction"),
          noShow: t("admin.appointment.noShow"),
          cancelConfirmTitle: t("admin.appointment.cancelConfirmTitle"),
          cancelConfirmBody: t("admin.appointment.cancelConfirmBody"),
          keepIt: t("admin.appointment.keepIt"),
          yesCancel: t("admin.appointment.yesCancel"),
          cancelReasonLabel: t("admin.appointment.cancelReasonLabel"),
          reschedule: t("admin.appointment.reschedule"),
          pickNewTime: t("admin.appointment.pickNewTime"),
          confirmReschedule: t("admin.appointment.confirmReschedule"),
          updating: t("admin.appointment.updating"),
          notes: t("admin.appointment.notes"),
          notesPlaceholder: t("admin.appointment.notesPlaceholder"),
          saveNotes: t("admin.appointment.saveNotes"),
          saved: t("admin.appointment.saved"),
          errorGeneric: t("admin.appointment.error_GENERIC"),
          picker: {
            pickDate: t("book.pickDate"),
            pickTime: t("book.pickTime"),
            loadingTimes: t("book.loadingTimes"),
            noSlotsDay: t("book.noSlotsDay"),
            closedMark: t("book.closedMark"),
            laterDays: t("book.laterDays"),
            earlierDays: t("book.earlierDays"),
          },
        }}
      />

      <AdminNotesEditor
        appointmentId={detail.id}
        initialNotes={detail.adminNotes}
        labels={{
          notes: t("admin.appointment.notes"),
          notesPlaceholder: t("admin.appointment.notesPlaceholder"),
          saveNotes: t("admin.appointment.saveNotes"),
          saved: t("admin.appointment.saved"),
          errorGeneric: t("admin.appointment.error_GENERIC"),
        }}
      />
    </div>
  );
}

function NotFound({ locale, label, action }: { locale: Locale; label: string; action: string }) {
  void locale;
  return (
    <div className="py-12 text-center">
      <p className="text-label text-lg font-semibold">{label}</p>
      <Link
        href={`/${locale}/admin/calendar`}
        className="text-accent mt-4 inline-flex text-[15px] font-medium"
      >
        {action}
      </Link>
    </div>
  );
}

function Row({ term, children }: { term: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2.5">
      <dt className="text-label-secondary shrink-0 pt-0.5 text-sm">{term}</dt>
      <dd className="text-label text-right text-[15px] font-medium">{children}</dd>
    </div>
  );
}

function statusTone(
  status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "NO_SHOW",
): string {
  switch (status) {
    case "CONFIRMED":
      return "bg-success/15 text-success";
    case "PENDING":
      return "bg-warning/15 text-warning";
    case "COMPLETED":
      return "bg-inset text-label-secondary";
    default:
      return "bg-destructive/10 text-destructive";
  }
}

function buildChunks(timezone: string, maxPickerDays: number): string[][] {
  const todayKey = epochToZonedParts(timezone, currentInstantMs()).dateKey;
  const keys: string[] = [];
  for (let offset = 0; offset < maxPickerDays; offset += 1) {
    keys.push(addDaysToDateKey(todayKey, offset));
  }
  const chunks: string[][] = [];
  for (let index = 0; index < keys.length; index += CHUNK_DAYS) {
    chunks.push(keys.slice(index, index + CHUNK_DAYS));
  }
  return chunks;
}
