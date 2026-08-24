import type { Metadata } from "next";
import Link from "next/link";
import { getLocale, getTranslator } from "@/i18n/server";
import { formatCurrency } from "@/i18n/format";
import { resolveLocalizedText } from "@/i18n/localized-text";
import { getShopContext } from "@/lib/tenant";
import { getActiveServices } from "@/db/repositories/public";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslator();
  return { title: t("servicesPage.title") };
}

export default async function ServicesPage() {
  const shop = await getShopContext();
  const locale = await getLocale();
  const { t } = await getTranslator();
  const services = await getActiveServices(shop.id);

  return (
    <div className="px-4 py-8">
      <header className="mb-6">
        <h1 className="text-label text-[32px] font-semibold tracking-tight">
          {t("servicesPage.title")}
        </h1>
        <p className="text-label-secondary mt-1 text-[15px]">{t("servicesPage.subtitle")}</p>
      </header>

      <ul className="grid gap-3 sm:grid-cols-2">
        {services.map((service) => {
          const name = resolveLocalizedText(service.name, locale);
          const description = resolveLocalizedText(service.description, locale);
          return (
            <li key={service.id}>
              <div className="bg-card shadow-card ring-separator flex h-full flex-col rounded-2xl p-4 ring-1">
                <div className="flex items-baseline justify-between gap-3">
                  <h2 className="text-label text-lg font-semibold">{name}</h2>
                  <span className="text-accent shrink-0 font-semibold">
                    {formatCurrency(service.priceCents, locale)}
                  </span>
                </div>
                {description ? (
                  <p className="text-label-secondary mt-1 flex-1 text-sm">{description}</p>
                ) : null}
                <div className="mt-4 flex items-center justify-between gap-3">
                  <span className="text-label-tertiary text-[13px]">
                    {t("servicesPage.minutes", { minutes: service.durationMinutes })}
                  </span>
                  <Link
                    href={`/book?service=${service.id}`}
                    className="bg-accent text-on-accent inline-flex h-10 items-center rounded-full px-5 text-sm font-medium transition-transform duration-150 ease-out active:scale-[0.96]"
                  >
                    {t("servicesPage.book")}
                  </Link>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
