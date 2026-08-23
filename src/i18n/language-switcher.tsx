"use client";

import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { useTransition } from "react";
import { LOCALES, type Locale } from "@/i18n/config";
import { useT } from "@/i18n/client";
import { persistLocale } from "@/i18n/actions";

/** Swaps the [locale] segment in place and persists the choice. */
export function LanguageSwitcher({ current }: { current: Locale }) {
  const pathname = usePathname();
  const router = useRouter();
  const t = useT();
  const [pending, startTransition] = useTransition();

  function switchTo(next: Locale) {
    if (next === current || pending) {
      return;
    }
    startTransition(async () => {
      await persistLocale(next);
      const segments = (pathname.startsWith("/") ? pathname : `/${current}`).split("/");
      segments[1] = next;
      const target = segments.join("/") || `/${next}`;
      router.push(target);
      router.refresh();
    });
  }

  return (
    <div
      role="group"
      aria-label={t("languageSwitcher.label")}
      className="bg-inset inline-flex rounded-full p-1"
    >
      {LOCALES.map((locale) => (
        <button
          key={locale}
          type="button"
          aria-pressed={locale === current}
          onClick={() => switchTo(locale)}
          className={`h-8 rounded-full px-4 text-sm font-medium transition-colors ${
            locale === current ? "bg-card text-label shadow-sm" : "text-label-secondary"
          }`}
        >
          {t(`languageSwitcher.${locale}`)}
        </button>
      ))}
    </div>
  );
}
