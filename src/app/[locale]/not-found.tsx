import { ErrorSurface } from "@/components/error-surface";
import { getLocale } from "@/i18n/server";
import { translate } from "@/i18n/resolve";

export default async function NotFound() {
  let locale = "en";
  try {
    locale = await getLocale();
  } catch {
    // Layout already validated the segment; keep English on any edge case.
  }
  return (
    <ErrorSurface
      eyebrow="404"
      title={translate(locale, "notFound.title")}
      subtitle={translate(locale, "notFound.subtitle")}
      actionLabel={translate(locale, "notFound.action")}
      actionHref={`/${locale}`}
    />
  );
}
