"use client";

import { Geist } from "next/font/google";
import { useEffect } from "react";
import { ErrorSurface } from "@/components/error-surface";
import { InlineScript } from "@/components/inline-script";
import { translate } from "@/i18n/resolve";
import { SCHEME_SCRIPT } from "@/lib/scheme-script";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

/**
 * Last resort boundary for crashes inside the root layout itself. Owns its
 * html and body, so it carries the token stylesheet and scheme bootstrap.
 * English only by design; the localized boundary lives in [locale]/error.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en" className={`${geistSans.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="flex min-h-full flex-col">
        <InlineScript html={SCHEME_SCRIPT} />
        <ErrorSurface
          className="flex-1"
          eyebrow="Oops"
          title={translate("en", "errorPage.title")}
          subtitle={translate("en", "errorPage.subtitle")}
          actionLabel={translate("en", "errorPage.retry")}
          onAction={reset}
          footnote={
            error.digest ? (
              <span>
                Ref: <span className="font-mono">{error.digest}</span>
              </span>
            ) : undefined
          }
        />
      </body>
    </html>
  );
}
