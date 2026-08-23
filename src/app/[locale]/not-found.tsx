import { getLocale } from "@/i18n/server";
import { NotFoundContent } from "./not-found-content";

export default async function NotFound() {
  let locale = "en";
  try {
    locale = await getLocale();
  } catch {
    // Layout already validated the segment; keep English on any edge case.
  }
  return <NotFoundContent locale={locale} />;
}
