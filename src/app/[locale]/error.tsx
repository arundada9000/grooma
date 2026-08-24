"use client";

import { useParams } from "next/navigation";
import { useEffect } from "react";
import { ErrorSurface } from "@/components/error-surface";
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
    <ErrorSurface
      eyebrow="Oops"
      title={translate(locale, "errorPage.title")}
      subtitle={translate(locale, "errorPage.subtitle")}
      actionLabel={translate(locale, "errorPage.retry")}
      onAction={reset}
      footnote={
        error.digest ? (
          <span>
            Ref: <span className="font-mono">{error.digest}</span>
          </span>
        ) : undefined
      }
    />
  );
}
