import type { Metadata } from "next";
import { getTranslator } from "@/i18n/server";
import { formatCurrency } from "@/i18n/format";
import { requireOwner } from "@/lib/auth/session";
import { getShopContext } from "@/lib/tenant";
import { listServices } from "@/db/repositories/shop-config";
import { ServicesManager } from "./services-client";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslator();
  return { title: t("admin.settings.cards.servicesTitle") };
}

export default async function AdminServicesSettingsPage() {
  await requireOwner();
  const shop = await getShopContext();
  const { locale, t } = await getTranslator();
  const services = await listServices(shop.id);

  return (
    <div>
      <h1 className="text-label text-[28px] font-semibold tracking-tight">
        {t("admin.settings.cards.servicesTitle")}
      </h1>
      <ServicesManager
        services={services.map((service) => ({
          ...service,
          name: { en: service.name.en, ne: service.name.ne },
          description: service.description
            ? { en: service.description.en, ne: service.description.ne }
            : null,
          priceLabel: formatCurrency(service.priceCents, locale),
        }))}
        labels={{
          add: t("admin.settings.add"),
          edit: t("admin.settings.edit"),
          save: t("admin.settings.save"),
          saving: t("admin.settings.saving"),
          saved: t("admin.settings.saved"),
          cancelLabel: t("admin.settings.cancel"),
          remove: t("admin.settings.remove"),
          confirmDelete: t("admin.settings.confirmDelete"),
          active: t("admin.settings.active"),
          inactive: t("admin.settings.inactive"),
          moveUp: t("admin.settings.moveUp"),
          moveDown: t("admin.settings.moveDown"),
          newService: t("admin.settings.services.newService"),
          empty: t("admin.settings.services.empty"),
          nameEn: t("admin.settings.nameEn"),
          nameNe: t("admin.settings.nameNe"),
          optionalNe: t("admin.settings.optionalNe"),
          description: t("admin.settings.services.description"),
          duration: t("admin.settings.services.duration"),
          buffer: t("admin.settings.services.buffer"),
          price: t("admin.settings.services.price"),
          priceHint: t("admin.settings.services.priceHint"),
          error_IN_USE: t("admin.settings.error_IN_USE"),
          error_INVALID_INPUT: t("admin.settings.error_INVALID_INPUT"),
          error_GENERIC: t("admin.settings.error_GENERIC"),
        }}
      />
    </div>
  );
}
