import type { Metadata } from "next";
import { getTranslator } from "@/i18n/server";
import { requireOwner } from "@/lib/auth/session";
import { getShopContext } from "@/lib/tenant";
import { listBarbers, listServices } from "@/db/repositories/shop-config";
import { BarbersManager } from "./barbers-client";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslator();
  return { title: t("admin.settings.cards.barbersTitle") };
}

export default async function AdminBarbersSettingsPage() {
  await requireOwner();
  const shop = await getShopContext();
  const { t } = await getTranslator();
  const [barbers, services] = await Promise.all([listBarbers(shop.id), listServices(shop.id)]);

  return (
    <div>
      <h1 className="text-label text-[28px] font-semibold tracking-tight">
        {t("admin.settings.cards.barbersTitle")}
      </h1>
      <BarbersManager
        barbers={barbers.map((barber) => ({
          id: barber.id,
          displayName: barber.displayName,
          bio: barber.bio ? { en: barber.bio.en, ne: barber.bio.ne } : null,
          active: barber.active,
          serviceIds: barber.serviceIds,
        }))}
        services={services.map((service) => ({
          id: service.id,
          label: service.name.en,
          active: service.active,
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
          newBarber: t("admin.settings.barbers.newBarber"),
          empty: t("admin.settings.barbers.empty"),
          nameEn: t("admin.settings.nameEn"),
          nameNe: t("admin.settings.nameNe"),
          optionalNe: t("admin.settings.optionalNe"),
          bio: t("admin.settings.barbers.bio"),
          servicesField: t("admin.settings.barbers.servicesField"),
          noServices: t("admin.settings.barbers.noServices"),
          error_IN_USE: t("admin.settings.error_IN_USE"),
          error_INVALID_INPUT: t("admin.settings.error_INVALID_INPUT"),
          error_GENERIC: t("admin.settings.error_GENERIC"),
        }}
      />
    </div>
  );
}
