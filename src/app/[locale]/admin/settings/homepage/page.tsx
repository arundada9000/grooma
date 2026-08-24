import type { Metadata } from "next";
import { getTranslator } from "@/i18n/server";
import { requireOwner } from "@/lib/auth/session";
import { getShopContext } from "@/lib/tenant";
import { HOMEPAGE_SECTION_TYPES } from "@/lib/validation/shop-config";
import { HomepageEditor } from "./homepage-client";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslator();
  return { title: t("admin.settings.cards.homepageTitle") };
}

// Section type → dictionary key segment (keys use underscores, not dashes).
const SECTION_KEY = {
  hero: "hero",
  services: "services",
  "featured-service": "featured_service",
  barbers: "barbers",
  about: "about",
  "why-us": "why_us",
  gallery: "gallery",
  testimonials: "testimonials",
  faq: "faq",
  "opening-hours": "opening_hours",
  location: "location",
  contact: "contact",
  "booking-cta": "booking_cta",
} as const;

export default async function AdminHomepageSettingsPage() {
  await requireOwner();
  const shop = await getShopContext();
  const { t } = await getTranslator();

  // Labels for every known section type so a type added later renders even
  // before the shop has stored it.
  const typeLabels = Object.fromEntries(
    HOMEPAGE_SECTION_TYPES.map((type) => [
      type,
      t(`admin.settings.homepage.sections.${SECTION_KEY[type]}`),
    ]),
  );

  return (
    <div>
      <h1 className="text-label text-[28px] font-semibold tracking-tight">
        {t("admin.settings.cards.homepageTitle")}
      </h1>
      <p className="text-label-secondary mt-0.5 text-sm">
        {t("admin.settings.cards.homepageDesc")}
      </p>
      <p className="text-label-tertiary mt-1 text-xs">{t("admin.settings.homepage.hint")}</p>
      <HomepageEditor
        initial={shop.homepage.sections.map((section) => ({
          type: section.type,
          enabled: section.enabled,
        }))}
        allTypes={[...HOMEPAGE_SECTION_TYPES]}
        typeLabels={typeLabels}
        labels={{
          save: t("admin.settings.save"),
          saving: t("admin.settings.saving"),
          saved: t("admin.settings.saved"),
          active: t("admin.settings.active"),
          inactive: t("admin.settings.inactive"),
          up: t("admin.settings.homepage.up"),
          down: t("admin.settings.homepage.down"),
          error_INVALID_INPUT: t("admin.settings.error_INVALID_INPUT"),
          error_GENERIC: t("admin.settings.error_GENERIC"),
        }}
      />
    </div>
  );
}
