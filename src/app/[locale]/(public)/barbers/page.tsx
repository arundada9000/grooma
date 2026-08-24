import type { Metadata } from "next";
import Link from "next/link";
import { getLocale, getTranslator } from "@/i18n/server";
import { resolveLocalizedText } from "@/i18n/localized-text";
import { getShopContext } from "@/lib/tenant";
import { getActiveBarbers } from "@/db/repositories/public";
import { breadcrumbJsonLd, buildPageMetadata, personItemListJsonLd } from "@/lib/seo/profile";
import { getSiteUrl } from "@/lib/seo/site-url";
import { JsonLd } from "@/components/seo/json-ld";

export async function generateMetadata(): Promise<Metadata> {
  const [shop, locale, { t }] = await Promise.all([getShopContext(), getLocale(), getTranslator()]);
  return buildPageMetadata({
    shopName: shop.name,
    tagline: shop.tagline,
    locale,
    path: "/barbers",
    title: `${t("barbersPage.title")} — ${shop.name}`,
  });
}

export default async function BarbersPage() {
  const shop = await getShopContext();
  const locale = await getLocale();
  const { t } = await getTranslator();
  const barbers = await getActiveBarbers(shop.id);

  return (
    <div className="px-4 py-8">
      <JsonLd data={personItemListJsonLd(barbers, { locale })} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: shop.name, url: `${getSiteUrl()}/${locale}` },
          { name: t("barbersPage.title"), url: `${getSiteUrl()}/${locale}/barbers` },
        ])}
      />
      <header className="mb-6">
        <h1 className="text-label text-[32px] font-semibold tracking-tight">
          {t("barbersPage.title")}
        </h1>
        <p className="text-label-secondary mt-1 text-[15px]">{t("barbersPage.subtitle")}</p>
      </header>

      <ul className="grid gap-3 sm:grid-cols-3">
        {barbers.map((barber) => {
          const bio = resolveLocalizedText(barber.bio, locale);
          return (
            <li key={barber.id}>
              <div className="bg-card shadow-card ring-separator flex h-full flex-col rounded-2xl p-4 ring-1">
                <span
                  aria-hidden="true"
                  className="bg-accent-soft text-accent ring-accent/20 mb-3 flex size-14 items-center justify-center rounded-full text-xl font-semibold ring-1"
                >
                  {initials(barber.displayName)}
                </span>
                <h2 className="text-label text-lg font-semibold">{barber.displayName}</h2>
                {bio ? <p className="text-label-secondary mt-1 flex-1 text-sm">{bio}</p> : null}
                <Link
                  href={`/book?barber=${barber.id}`}
                  className="bg-accent-soft text-accent mt-4 inline-flex h-10 items-center justify-center rounded-full px-4 text-sm font-medium transition-transform duration-150 ease-out active:scale-[0.96]"
                >
                  {t("barbersPage.bookWith", { name: barber.displayName })}
                </Link>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
