import { and, eq, gte, lt } from "drizzle-orm";
import type { Metadata } from "next";
import { db } from "@/db";
import { appointments } from "@/db/schema";
import { requireOwner } from "@/lib/auth/session";
import { getTranslator } from "@/i18n/server";
import { SignOutButton } from "./sign-out-button";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslator();
  return {
    title: t("admin.dashboardTitle"),
  };
}

function kathmanduDayBounds(): { startOfDay: Date; endOfDay: Date } {
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kathmandu",
  }).format(new Date());
  return {
    startOfDay: new Date(`${today}T00:00:00+05:45`),
    endOfDay: new Date(`${today}T24:00:00+05:45`),
  };
}

export default async function AdminPage() {
  // requireOwner enforces session + OWNER role; user.shopId scopes every query.
  const session = await requireOwner();
  const { t } = await getTranslator();
  const { startOfDay, endOfDay } = kathmanduDayBounds();

  const todaysAppointments = await db
    .select({ id: appointments.id })
    .from(appointments)
    .where(
      and(
        eq(appointments.shopId, session.user.shopId),
        gte(appointments.startTime, startOfDay),
        lt(appointments.startTime, endOfDay),
      ),
    )
    .then((rows) => rows.length);

  return (
    <main className="mx-auto min-h-dvh max-w-3xl px-4 py-10">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-label-tertiary text-xs tracking-[0.2em] uppercase">Grooma</p>
          <h1 className="text-label mt-1 text-2xl font-semibold tracking-tight">
            {t("admin.dashboardTitle")}
          </h1>
          <p className="text-label-secondary mt-1 text-sm">{t("admin.shellNote")}</p>
        </div>
        <SignOutButton />
      </header>

      <section className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="bg-card shadow-card ring-separator rounded-2xl p-5 ring-1">
          <p className="text-label-secondary text-sm">{t("admin.signedInAs")}</p>
          <p className="text-label mt-1 truncate font-medium">{session.user.name}</p>
          <p className="text-label-secondary truncate text-sm">{session.user.email}</p>
        </div>
        <div className="bg-card shadow-card ring-separator rounded-2xl p-5 ring-1">
          <p className="text-label-secondary text-sm">{t("admin.role")}</p>
          <p className="text-label mt-1 font-medium">{session.user.role}</p>
        </div>
        <div className="bg-card shadow-card ring-separator rounded-2xl p-5 ring-1">
          <p className="text-label-secondary text-sm">{t("admin.appointmentsToday")}</p>
          <p className="text-label mt-1 font-medium">{todaysAppointments}</p>
        </div>
      </section>
    </main>
  );
}
