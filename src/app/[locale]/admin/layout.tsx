import type { ReactNode } from "react";
import type { Metadata } from "next";
import { getLocale, getTranslator } from "@/i18n/server";
import { requireOwner } from "@/lib/auth/session";
import { AdminNav } from "@/components/admin/admin-nav";
import { SignOutButton } from "./sign-out-button";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/**
 * Admin shell. requireOwner runs here once so every nested page can
 * trust the session; the shop scope comes from the session user.
 */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireOwner();
  const locale = await getLocale();
  const { t } = await getTranslator();

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-separator bg-background/80 border-b backdrop-blur-xl">
        <div className="mx-auto flex h-14 w-full max-w-4xl items-center justify-between gap-3 px-4">
          <span className="text-label flex min-w-0 items-center gap-2 text-[17px] font-semibold tracking-tight">
            <span aria-hidden="true" className="bg-accent size-2.5 shrink-0 rounded-full" />
            Grooma
          </span>
          <SignOutButton label={t("admin.signOut")} />
        </div>
      </header>

      <AdminNav
        items={[
          { href: `/${locale}/admin`, label: t("admin.nav.dashboard") },
          { href: `/${locale}/admin/calendar`, label: t("admin.nav.calendar") },
          { href: `/${locale}/admin/customers`, label: t("admin.nav.customers") },
          { href: `/${locale}/admin/settings`, label: t("admin.settings.title") },
        ]}
      />

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 pt-6 pb-24 sm:pb-10">{children}</main>
    </div>
  );
}
