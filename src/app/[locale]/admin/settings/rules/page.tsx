import type { Metadata } from "next";
import { getTranslator } from "@/i18n/server";
import { requireOwner } from "@/lib/auth/session";
import { getShopContext } from "@/lib/tenant";
import { RulesForm } from "./rules-client";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslator();
  return { title: t("admin.settings.cards.rulesTitle") };
}

export default async function AdminRulesSettingsPage() {
  await requireOwner();
  const shop = await getShopContext();
  const { t } = await getTranslator();
  const rules = shop.bookingRules;

  return (
    <div>
      <h1 className="text-label text-[28px] font-semibold tracking-tight">
        {t("admin.settings.cards.rulesTitle")}
      </h1>
      <p className="text-label-secondary mt-0.5 text-sm">{t("admin.settings.cards.rulesDesc")}</p>
      <RulesForm
        initial={rules}
        labels={{
          save: t("admin.settings.save"),
          saving: t("admin.settings.saving"),
          saved: t("admin.settings.saved"),
          slotIntervalMinutes: t("admin.settings.rules.slotIntervalMinutes"),
          minNoticeMinutes: t("admin.settings.rules.minNoticeMinutes"),
          maxAdvanceDays: t("admin.settings.rules.maxAdvanceDays"),
          cancelDeadlineMinutes: t("admin.settings.rules.cancelDeadlineMinutes"),
          rescheduleDeadlineMinutes: t("admin.settings.rules.rescheduleDeadlineMinutes"),
          maxDailyBookingsPerCustomer: t("admin.settings.rules.maxDailyBookingsPerCustomer"),
          unlimited: t("admin.settings.rules.unlimited"),
          error_INVALID_INPUT: t("admin.settings.error_INVALID_INPUT"),
          error_GENERIC: t("admin.settings.error_GENERIC"),
        }}
      />
    </div>
  );
}
