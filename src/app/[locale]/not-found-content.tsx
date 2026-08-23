import Link from "next/link";
import { BarberPole } from "@/components/ui/barber-pole";
import { translate } from "@/i18n/resolve";

/**
 * Shared barber themed 404 body. Locale aware when a locale is known;
 * pass nothing to render the English fallback (global-not-found case).
 */
export function NotFoundContent({ locale = "en" }: { locale?: string }) {
  return (
    <main className="bg-background text-label flex min-h-dvh flex-col items-center justify-center gap-8 px-6 py-16 text-center">
      <div className="flex items-center gap-5">
        <BarberPole className="h-36 w-7" />
        <div>
          <p className="text-destructive text-sm font-semibold tracking-[0.3em] uppercase">404</p>
          <h1 className="mt-2 max-w-md text-3xl font-semibold tracking-tight sm:text-4xl">
            {translate(locale, "notFound.title")}
          </h1>
          <p className="text-label-secondary mx-auto mt-3 max-w-sm text-[15px]">
            {translate(locale, "notFound.subtitle")}
          </p>
        </div>
        <BarberPole className="h-36 w-7" />
      </div>

      <div aria-hidden="true" className="bg-separator h-px w-full max-w-xs" />

      <Link
        href={`/${locale}`}
        className="bg-accent text-on-accent inline-flex h-11 items-center justify-center rounded-full px-6 font-medium transition-transform active:scale-[0.96]"
      >
        {translate(locale, "notFound.action")}
      </Link>

      <p className="text-label-tertiary max-w-xs text-xs leading-relaxed">
        Grooma &middot; Your grooming, made simple.
      </p>
    </main>
  );
}
