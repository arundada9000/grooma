import Link from "next/link";
import type { Metadata } from "next";
import { getTranslator } from "@/i18n/server";
import { requireOwner } from "@/lib/auth/session";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslator();
  return { title: t("admin.settings.title") };
}

const CARDS = [
  { href: "appearance", titleKey: "cards.appearanceTitle", descKey: "cards.appearanceDesc" },
  { href: "homepage", titleKey: "cards.homepageTitle", descKey: "cards.homepageDesc" },
  { href: "services", titleKey: "cards.servicesTitle", descKey: "cards.servicesDesc" },
  { href: "barbers", titleKey: "cards.barbersTitle", descKey: "cards.barbersDesc" },
  { href: "schedule", titleKey: "cards.scheduleTitle", descKey: "cards.scheduleDesc" },
  { href: "rules", titleKey: "cards.rulesTitle", descKey: "cards.rulesDesc" },
  { href: "general", titleKey: "cards.generalTitle", descKey: "cards.generalDesc" },
] as const;

export default async function AdminSettingsPage() {
  await requireOwner();
  const { t } = await getTranslator();

  return (
    <div>
      <h1 className="text-label text-[28px] font-semibold tracking-tight">
        {t("admin.settings.title")}
      </h1>
      <p className="text-label-secondary mt-0.5 text-sm">{t("admin.settings.subtitle")}</p>

      <div className="mt-5 grid gap-3 pb-6 sm:grid-cols-2">
        {CARDS.map((card) => (
          <Link
            key={card.href}
            href={`settings/${card.href}`}
            className="ring-separator bg-card hover:bg-inset focus-visible:outline-accent rounded-2xl p-4 ring-1 transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2"
          >
            <p className="text-label text-[15px] font-semibold">
              {t(`admin.settings.${card.titleKey}`)}
            </p>
            <p className="text-label-secondary mt-0.5 text-[13px] leading-relaxed">
              {t(`admin.settings.${card.descKey}`)}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
