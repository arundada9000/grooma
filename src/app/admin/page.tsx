import { and, eq, gte, lt } from "drizzle-orm";
import type { Metadata } from "next";
import { db } from "@/db";
import { appointments } from "@/db/schema";
import { requireOwner } from "@/lib/auth/session";
import { SignOutButton } from "./sign-out-button";

export const metadata: Metadata = {
  title: "Dashboard",
};

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
          <p className="text-xs tracking-[0.2em] text-neutral-400 uppercase">Grooma</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-neutral-900">Dashboard</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Placeholder shell. Full admin experience lands in a later phase.
          </p>
        </div>
        <SignOutButton />
      </header>

      <section className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
          <p className="text-sm text-neutral-500">Signed in as</p>
          <p className="mt-1 truncate font-medium text-neutral-900">{session.user.name}</p>
          <p className="truncate text-sm text-neutral-500">{session.user.email}</p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
          <p className="text-sm text-neutral-500">Role</p>
          <p className="mt-1 font-medium text-neutral-900">{session.user.role}</p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
          <p className="text-sm text-neutral-500">Appointments today</p>
          <p className="mt-1 font-medium text-neutral-900">{todaysAppointments}</p>
        </div>
      </section>
    </main>
  );
}
