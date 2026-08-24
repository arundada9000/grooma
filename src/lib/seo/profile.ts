/**
 * Pure SEO builders (spec sections 42-45, 68). Everything derives from
 * live shop rows: owners edit Settings and the homepage editor and
 * metadata, JSON-LD, sitemaps all follow. Nothing about a specific
 * business is hardcoded here.
 *
 * Kept free of server-only imports so unit tests run hermetically.
 */
import type { Metadata } from "next";
import { INTL_LOCALES, type Locale } from "@/i18n/config";
import { buildAlternates } from "@/i18n/hreflang";
import { resolveLocalizedText, type LocalizedText } from "@/i18n/localized-text";
import type { ContactInfo, FaqItem, LocationInfo, SocialLinks } from "@/lib/validation/shop-config";

/* ------------------------------------------------------------------ */
/* Page metadata                                                       */
/* ------------------------------------------------------------------ */

export interface SeoPageInput {
  shopName: string;
  /** Shop tagline or description; the default description source. */
  tagline?: string | null;
  locale: Locale;
  /** Path without the locale prefix, e.g. "/services" or "". */
  path: string;
  title: string;
  descriptionOverride?: string | null;
  noindex?: boolean;
}

/** Absolute URL helpers. */
function pageUrl(siteUrl: string, locale: Locale, path: string): string {
  return `${siteUrl}/${locale}${path === "/" ? "" : path}`;
}

export function buildPageMetadata(input: SeoPageInput): Metadata {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const base = siteUrl.replace(/\/+$/, "");
  const canonical = pageUrl(base, input.locale, input.path);
  const description =
    input.descriptionOverride?.trim() ||
    input.tagline?.trim() ||
    `${input.shopName} — book online.`;

  return {
    title: input.title,
    description,
    alternates: {
      canonical,
      languages: buildAlternates(input.path === "/" ? "/" : input.path, base).languages,
    },
    openGraph: {
      type: "website",
      url: canonical,
      siteName: input.shopName,
      title: input.title,
      description,
      locale: INTL_LOCALES[input.locale],
    },
    twitter: {
      card: "summary_large_image",
      title: input.title,
      description,
    },
    ...(input.noindex ? { robots: { index: false, follow: false } } : {}),
  };
}

/* ------------------------------------------------------------------ */
/* JSON-LD                                                             */
/* ------------------------------------------------------------------ */

export interface BusinessInput {
  name: string;
  tagline?: string | null;
  description?: string | null;
  contact: ContactInfo;
  location: LocationInfo;
  social: SocialLinks;
  currency: string;
}

const WEEKDAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

/**
 * HairSalon (a LocalBusiness) for the home page. Opening hours come
 * straight from the shop-scope schedule rows; social links become
 * sameAs so search engines tie profiles together.
 */
export function localBusinessJsonLd(
  business: BusinessInput,
  hours: { weekday: number; intervals: { start: string; end: string }[] }[],
  options: { siteUrl: string; locale: Locale },
): Record<string, unknown> {
  const home = `${options.siteUrl}/${options.locale}`;
  const sameAs = Object.values(business.social).filter((url): url is string => Boolean(url));

  return {
    "@context": "https://schema.org",
    "@type": "HairSalon",
    name: business.name,
    ...(business.description?.trim() || business.tagline?.trim()
      ? { description: business.description?.trim() || business.tagline?.trim() }
      : {}),
    url: home,
    telephone: business.contact.phone,
    ...(business.contact.email ? { email: business.contact.email } : {}),
    image: [`${options.siteUrl}/icons/icon-512.png`, `${options.siteUrl}/en/opengraph-image`],
    priceRange: business.currency,
    address: postalAddress(business.location),
    ...(business.location.latitude != null && business.location.longitude != null
      ? {
          geo: {
            "@type": "GeoCoordinates",
            latitude: business.location.latitude,
            longitude: business.location.longitude,
          },
        }
      : {}),
    ...(business.location.mapsUrl ? { hasMap: business.location.mapsUrl } : {}),
    ...(sameAs.length > 0 ? { sameAs } : {}),
    openingHoursSpecification: hours.flatMap((row) =>
      row.intervals.map((interval) => ({
        "@type": "OpeningHoursSpecification",
        dayOfWeek: WEEKDAY_NAMES[row.weekday],
        opens: interval.start,
        closes: interval.end,
      })),
    ),
  };
}

function postalAddress(location: LocationInfo): Record<string, unknown> {
  return {
    "@type": "PostalAddress",
    streetAddress: location.addressLine,
    addressLocality: location.city,
    ...(location.province ? { addressRegion: location.province } : {}),
    ...(location.postalCode ? { postalCode: location.postalCode } : {}),
    addressCountry: location.country,
  };
}

/** Service ItemList for the services page (spec 43). */
export function serviceItemListJsonLd(
  services: {
    id: string;
    name: LocalizedText;
    description: LocalizedText | null;
    priceCents: number;
  }[],
  options: { locale: Locale; currency: string; siteUrl: string },
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: services.map((service, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Service",
        name: resolveLocalizedText(service.name, options.locale),
        ...(resolveLocalizedText(service.description, options.locale)
          ? { description: resolveLocalizedText(service.description, options.locale) }
          : {}),
        provider: { "@type": "HairSalon" },
        offers: {
          "@type": "Offer",
          price: (service.priceCents / 100).toFixed(2),
          priceCurrency: options.currency,
        },
      },
    })),
  };
}

/** Person ItemList for the barbers page (spec 44). */
export function personItemListJsonLd(
  barbers: { displayName: string; bio: LocalizedText | null; photoUrl: string | null }[],
  options: { locale: Locale },
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: barbers.map((barber, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Person",
        name: barber.displayName,
        ...(resolveLocalizedText(barber.bio, options.locale)
          ? { description: resolveLocalizedText(barber.bio, options.locale) }
          : {}),
        ...(barber.photoUrl ? { image: barber.photoUrl } : {}),
      },
    })),
  };
}

/** BreadcrumbList ending on the current page. */
export function breadcrumbJsonLd(items: { name: string; url: string }[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/** FAQPage from the homepage editor's faq section content (spec 68). */
export function faqJsonLd(items: FaqItem[], locale: Locale): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: resolveLocalizedText(item.question, locale),
      acceptedAnswer: {
        "@type": "Answer",
        text: resolveLocalizedText(item.answer, locale),
      },
    })),
  };
}
