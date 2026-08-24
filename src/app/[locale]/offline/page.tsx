import type { Metadata } from "next";
import { ErrorSurface } from "@/components/error-surface";
import { getLocale, getTranslator } from "@/i18n/server";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/**
 * Precached by the service worker at install time and served when a
 * navigation fails offline. Static copy, no data reads beyond the
 * layout's own, so it always renders.
 */
export default async function OfflinePage() {
  const locale = await getLocale();
  const { t } = await getTranslator();

  return (
    <ErrorSurface
      eyebrow={t("pwa.offlineEyebrow")}
      title={t("pwa.offlineTitle")}
      subtitle={t("pwa.offlineBody")}
      actionLabel={t("pwa.offlineAction")}
      actionHref={`/${locale}`}
      footnote={t("pwa.offlineNote")}
    />
  );
}
