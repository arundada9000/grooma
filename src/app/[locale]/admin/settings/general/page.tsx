import type { Metadata } from "next";
import { getTranslator } from "@/i18n/server";
import { requireOwner } from "@/lib/auth/session";
import { getShopContext } from "@/lib/tenant";
import { GeneralForm } from "./general-client";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslator();
  return { title: t("admin.settings.cards.generalTitle") };
}

export default async function AdminGeneralSettingsPage() {
  await requireOwner();
  const shop = await getShopContext();
  const { t } = await getTranslator();

  return (
    <div>
      <h1 className="text-label text-[28px] font-semibold tracking-tight">
        {t("admin.settings.cards.generalTitle")}
      </h1>
      <p className="text-label-secondary mt-0.5 text-sm">{t("admin.settings.cards.generalDesc")}</p>
      <GeneralForm
        initial={{
          name: shop.name,
          shortName: shop.shortName ?? "",
          tagline: shop.tagline ?? "",
          description: shop.description ?? "",
          phone: shop.contact.phone,
          email: shop.contact.email ?? "",
          whatsapp: shop.contact.whatsapp ?? "",
          website: shop.contact.website ?? "",
          addressLine: shop.location.addressLine,
          city: shop.location.city,
          province: shop.location.province ?? "",
          country: shop.location.country,
          postalCode: shop.location.postalCode ?? "",
          mapsUrl: shop.location.mapsUrl ?? "",
          facebook: shop.social.facebook ?? "",
          instagram: shop.social.instagram ?? "",
          tiktok: shop.social.tiktok ?? "",
          twitter: shop.social.twitter ?? "",
          youtube: shop.social.youtube ?? "",
        }}
        labels={{
          save: t("admin.settings.save"),
          saving: t("admin.settings.saving"),
          saved: t("admin.settings.saved"),
          shopName: t("admin.settings.general.shopName"),
          shortName: t("admin.settings.general.shortName"),
          tagline: t("admin.settings.general.tagline"),
          description: t("admin.settings.general.description"),
          contactTitle: t("admin.settings.general.contactTitle"),
          phone: t("admin.settings.general.phone"),
          email: t("admin.settings.general.email"),
          whatsapp: t("admin.settings.general.whatsapp"),
          website: t("admin.settings.general.website"),
          locationTitle: t("admin.settings.general.locationTitle"),
          addressLine: t("admin.settings.general.addressLine"),
          city: t("admin.settings.general.city"),
          province: t("admin.settings.general.province"),
          country: t("admin.settings.general.country"),
          postalCode: t("admin.settings.general.postalCode"),
          mapsUrl: t("admin.settings.general.mapsUrl"),
          socialTitle: t("admin.settings.general.socialTitle"),
          facebook: t("admin.settings.general.facebook"),
          instagram: t("admin.settings.general.instagram"),
          tiktok: t("admin.settings.general.tiktok"),
          twitter: t("admin.settings.general.twitter"),
          youtube: t("admin.settings.general.youtube"),
          error_INVALID_INPUT: t("admin.settings.error_INVALID_INPUT"),
          error_GENERIC: t("admin.settings.error_GENERIC"),
        }}
      />
    </div>
  );
}
