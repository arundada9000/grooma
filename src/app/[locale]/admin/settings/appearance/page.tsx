import type { Metadata } from "next";
import { getTranslator } from "@/i18n/server";
import { requireOwner } from "@/lib/auth/session";
import { getShopContext } from "@/lib/tenant";
import { PRESETS } from "@/lib/theme/presets";
import { FONT_PAIRINGS, type FontPairingId } from "@/lib/theme/fonts";
import { AppearanceEditor } from "./appearance-client";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslator();
  return { title: t("admin.settings.cards.appearanceTitle") };
}

export default async function AdminAppearanceSettingsPage() {
  await requireOwner();
  const shop = await getShopContext();
  const { t } = await getTranslator();
  const branding = shop.branding;

  return (
    <div>
      <h1 className="text-label text-[28px] font-semibold tracking-tight">
        {t("admin.settings.cards.appearanceTitle")}
      </h1>
      <p className="text-label-secondary mt-0.5 text-sm">
        {t("admin.settings.cards.appearanceDesc")}
      </p>
      <AppearanceEditor
        initial={{
          presetId: branding.presetId,
          fontPairing: branding.fontPairing,
          style: branding.customTheme?.style,
          light: branding.customTheme?.light ?? {},
          dark: branding.customTheme?.dark ?? {},
          logoUrl: branding.logoUrl ?? "",
          faviconUrl: branding.faviconUrl ?? "",
        }}
        presets={Object.values(PRESETS).map((preset) => ({
          id: preset.id,
          name: preset.name,
          accentLight: preset.light.accent,
          backgroundLight: preset.light.background,
          accentDark: preset.dark.accent,
          backgroundDark: preset.dark.background,
        }))}
        fontPairings={(Object.entries(FONT_PAIRINGS) as [FontPairingId, { name: string }][]).map(
          ([id, pairing]) => ({ id, name: pairing.name }),
        )}
        labels={{
          save: t("admin.settings.save"),
          saving: t("admin.settings.saving"),
          saved: t("admin.settings.saved"),
          presetLabel: t("admin.settings.appearance.presetLabel"),
          fontsLabel: t("admin.settings.appearance.fontsLabel"),
          styleLabel: t("admin.settings.appearance.styleLabel"),
          stylesStandard: t("admin.settings.appearance.styles.standard"),
          stylesSoft: t("admin.settings.appearance.styles.soft"),
          stylesDeep: t("admin.settings.appearance.styles.deep"),
          customTitle: t("admin.settings.appearance.customTitle"),
          lightScheme: t("admin.settings.appearance.lightScheme"),
          darkScheme: t("admin.settings.appearance.darkScheme"),
          reset: t("admin.settings.appearance.reset"),
          colorLabels_background: t("admin.settings.appearance.colorLabels.background"),
          colorLabels_card: t("admin.settings.appearance.colorLabels.card"),
          colorLabels_inset: t("admin.settings.appearance.colorLabels.inset"),
          colorLabels_label: t("admin.settings.appearance.colorLabels.label"),
          colorLabels_labelSecondary: t("admin.settings.appearance.colorLabels.labelSecondary"),
          colorLabels_labelTertiary: t("admin.settings.appearance.colorLabels.labelTertiary"),
          colorLabels_separator: t("admin.settings.appearance.colorLabels.separator"),
          colorLabels_accent: t("admin.settings.appearance.colorLabels.accent"),
          colorLabels_accentSoft: t("admin.settings.appearance.colorLabels.accentSoft"),
          colorLabels_onAccent: t("admin.settings.appearance.colorLabels.onAccent"),
          logoUrl: t("admin.settings.appearance.logoUrl"),
          faviconUrl: t("admin.settings.appearance.faviconUrl"),
          previewNote: t("admin.settings.appearance.previewNote"),
          contrastWarning: t("admin.settings.appearance.contrastWarning"),
          contrastPairs_labelOnBackground: t(
            "admin.settings.appearance.contrastPairs.labelOnBackground",
          ),
          contrastPairs_labelSecondaryOnBackground: t(
            "admin.settings.appearance.contrastPairs.labelSecondaryOnBackground",
          ),
          contrastPairs_onAccent: t("admin.settings.appearance.contrastPairs.onAccent"),
          contrastPairs_accentOnBackground: t(
            "admin.settings.appearance.contrastPairs.accentOnBackground",
          ),
          contrastPairs_onDestructive: t("admin.settings.appearance.contrastPairs.onDestructive"),
          schemes_light: t("admin.settings.appearance.schemes.light"),
          schemes_dark: t("admin.settings.appearance.schemes.dark"),
          error_INVALID_INPUT: t("admin.settings.error_INVALID_INPUT"),
          error_GENERIC: t("admin.settings.error_GENERIC"),
        }}
      />
    </div>
  );
}
