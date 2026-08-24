import type { MetadataRoute } from "next";
import { LOCALES } from "@/i18n/config";
import { getSiteUrl } from "@/lib/seo/site-url";

/** Crawlable public routes; manage/admin/style stay out on purpose. */
const PUBLIC_PATHS = ["", "/services", "/barbers", "/book"] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl();
  return PUBLIC_PATHS.map((path) => ({
    url: `${base}/en${path}`,
    lastModified: new Date(),
    alternates: {
      languages: Object.fromEntries(LOCALES.map((locale) => [locale, `${base}/${locale}${path}`])),
    },
  }));
}
