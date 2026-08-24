import Link from "next/link";
import { cn } from "@/lib/cn";
import { getTranslator } from "@/i18n/server";
import type { Locale } from "@/i18n/config";
import { formatCurrency, formatTime } from "@/i18n/format";
import type { AdminAppointmentRow } from "@/db/repositories/admin";

/** Shared presentational bits for admin lists. */

export async function StatusChip({ status }: { status: AdminAppointmentRow["status"] }) {
  const { t } = await getTranslator();
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded-full px-2.5 text-[11px] font-semibold tracking-wide uppercase",
        statusTone(status),
      )}
    >
      {t(`manage.status_${status}`)}
    </span>
  );
}

function statusTone(status: AdminAppointmentRow["status"]): string {
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

export async function AppointmentRow({
  appointment,
  href,
  locale,
  timePrefix,
}: {
  appointment: AdminAppointmentRow;
  href: string;
  locale: Locale;
  timePrefix?: string;
}) {
  const cancelled = appointment.status === "CANCELLED" || appointment.status === "NO_SHOW";
  return (
    <Link
      href={href}
      className={cn(
        "ring-separator bg-card hover:bg-inset flex items-center gap-3 rounded-2xl p-3 ring-1 transition-colors",
        cancelled && "opacity-55",
      )}
    >
      <div className="w-14 shrink-0 text-center">
        <p className="text-label text-[13px] font-semibold tabular-nums">
          {timePrefix ?? formatTime(appointment.startMs, locale)}
        </p>
      </div>
      <span aria-hidden="true" className="bg-separator h-9 w-px shrink-0" />
      <div className="min-w-0 flex-1">
        <p
          className={cn("text-label truncate text-[15px] font-medium", cancelled && "line-through")}
        >
          {appointment.customerName}
        </p>
        <p className="text-label-secondary truncate text-[13px]">
          {appointment.serviceName.en} · {appointment.barberName}
        </p>
      </div>
      <StatusChip status={appointment.status} />
      <span className="text-label-secondary hidden w-20 shrink-0 text-right text-[13px] tabular-nums sm:block">
        {formatCurrency(appointment.priceCents, locale)}
      </span>
    </Link>
  );
}

export function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="text-label-secondary mb-3 text-xs font-semibold tracking-[0.12em] uppercase">
        {title}
      </h2>
      {children}
    </section>
  );
}
