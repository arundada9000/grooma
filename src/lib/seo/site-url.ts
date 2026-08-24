/**
 * The single place that decides where this deployment lives. Point
 * NEXT_PUBLIC_SITE_URL at the production domain (see .env.example)
 * and every canonical URL, hreflang target, OG image, sitemap entry
 * and robots reference follows. Localhost fallback keeps dev honest.
 */
export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return raw.replace(/\/+$/, "");
}
