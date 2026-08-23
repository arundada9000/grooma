import Link from "next/link";
import { getTranslator } from "@/i18n/server";
import { LanguageSwitcher } from "@/i18n/language-switcher";

export default async function Home() {
  const { locale, t } = await getTranslator();

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="absolute top-6 right-6">
        <LanguageSwitcher current={locale} />
      </div>
      <h1 className="text-4xl font-semibold tracking-tight">Grooma</h1>
      <p className="text-label-secondary max-w-sm text-lg">{t("home.tagline")}</p>
      <p className="text-label-tertiary text-sm">{t("home.placeholderNote")}</p>
      <Link
        href={`/${locale}/style`}
        className="bg-accent-soft text-accent inline-flex h-11 items-center rounded-full px-5 font-medium transition-transform active:scale-[0.96]"
      >
        {t("home.viewDesignSystem")}
      </Link>
    </main>
  );
}
