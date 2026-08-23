"use client";

import { useParams } from "next/navigation";
import { useEffect } from "react";
import { BarberPole } from "@/components/ui/barber-pole";
import { isLocale } from "@/i18n/config";
import { translate } from "@/i18n/resolve";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const params = useParams<{ locale?: string }>();
  const locale = isLocale(params?.locale) ? params.locale : "en";

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="bg-background text-label flex min-h-dvh flex-col items-center justify-center gap-8 px-6 py-16 text-center">
      <div className="flex items-center gap-5">
        <BarberPole className="h-36 w-7" />
        <div>
          <p className="text-destructive text-sm font-semibold tracking-[0.3em] uppercase">Oops</p>
          <h1 className="mt-2 max-w-md text-3xl font-semibold tracking-tight sm:text-4xl">
            {translate(locale, "errorPage.title")}
          </h1>
          <p className="text-label-secondary mx-auto mt-3 max-w-sm text-[15px]">
            {translate(locale, "errorPage.subtitle")}
          </p>
        </div>
        <BarberPole className="h-36 w-7" />
      </div>

      <div aria-hidden="true" className="bg-separator h-px w-full max-w-xs" />

      <button
        type="button"
        onClick={reset}
        className="bg-accent text-on-accent inline-flex h-11 items-center justify-center rounded-full px-6 font-medium transition-transform active:scale-[0.96]"
      >
        {translate(locale, "errorPage.retry")}
      </button>

      {error.digest ? <p className="text-label-tertiary text-xs">Ref: {error.digest}</p> : null}
    </main>
  );
}
