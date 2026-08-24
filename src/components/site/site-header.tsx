import Link from "next/link";
import { getTranslator } from "@/i18n/server";
import { LanguageSwitcher } from "@/i18n/language-switcher";
import { cn } from "@/lib/cn";

/**
 * Public site chrome. Shop identity arrives via props so these stay
 * plain server components; locale comes from the route.
 */
export async function SiteHeader({
  shopName,
  shortName,
}: {
  shopName: string;
  shortName: string | null;
}) {
  const { locale, t } = await getTranslator();

  const links = [
    { href: `/${locale}/services`, label: t("nav.services") },
    { href: `/${locale}/barbers`, label: t("nav.barbers") },
  ];

  return (
    <header className="bg-background/80 border-separator sticky top-0 z-40 border-b backdrop-blur-xl">
      <div className="mx-auto flex h-14 w-full max-w-3xl items-center justify-between gap-3 px-4">
        <Link href={`/${locale}`} className="flex min-w-0 items-center gap-2">
          <span aria-hidden="true" className="bg-accent size-2.5 shrink-0 rounded-full" />
          <span className="text-label truncate text-[17px] font-semibold tracking-tight">
            {shortName ?? shopName}
          </span>
        </Link>
        <nav aria-label="Main" className="hidden items-center gap-4 sm:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-label-secondary hover:text-label text-sm font-medium transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <LanguageSwitcher current={locale} />
          <Link
            href={`/${locale}/book`}
            className={cn(
              "bg-accent text-on-accent inline-flex h-9 items-center rounded-full px-4 text-sm font-medium",
              "transition-transform duration-150 ease-out active:scale-[0.96]",
            )}
          >
            {t("nav.book")}
          </Link>
        </div>
      </div>
    </header>
  );
}

export async function SiteFooter({ shopName }: { shopName: string }) {
  const year = new Date().getFullYear();
  return (
    <footer className="border-separator mt-auto border-t">
      <div className="mx-auto w-full max-w-3xl px-4 py-8 text-center">
        <p className="text-label-tertiary text-[13px]">
          {year} © {shopName}
        </p>
      </div>
    </footer>
  );
}
