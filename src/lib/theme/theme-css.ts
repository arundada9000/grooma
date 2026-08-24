import type { CSSProperties } from "react";
import { getFontPairing } from "./fonts";
import { getPreset, SCALE_STYLES, type ScaleStyleId, type ThemeColors } from "./presets";

/**
 * Converts shop branding into inline CSS custom properties applied to the
 * html element. Light values ride the --tl- prefix, dark values --td-, and
 * scheme independent scale and font values --t-. globals.css maps them to
 * the semantic tokens; inline styles beat stylesheet defaults without any
 * cascade ordering games. Custom overrides from the theme builder merge on
 * top of the preset; unknown keys are ignored by the COLOR_KEYS walk.
 */

const COLOR_KEYS: Array<{ key: keyof ThemeColors; css: string }> = [
  { key: "background", css: "background" },
  { key: "card", css: "card" },
  { key: "inset", css: "inset" },
  { key: "backdrop", css: "backdrop" },
  { key: "label", css: "label" },
  { key: "labelSecondary", css: "label-secondary" },
  { key: "labelTertiary", css: "label-tertiary" },
  { key: "separator", css: "separator" },
  { key: "accent", css: "accent" },
  { key: "accentSoft", css: "accent-soft" },
  { key: "onAccent", css: "on-accent" },
  { key: "destructive", css: "destructive" },
  { key: "destructiveSoft", css: "destructive-soft" },
  { key: "onDestructive", css: "on-destructive" },
  { key: "success", css: "success" },
  { key: "warning", css: "warning" },
];

export interface CustomThemeOverrides {
  light?: Partial<ThemeColors>;
  dark?: Partial<ThemeColors>;
  style?: ScaleStyleId;
}

export function buildThemeStyle(branding: {
  presetId?: string;
  fontPairing?: string;
  customTheme?: CustomThemeOverrides;
}): CSSProperties {
  const preset = getPreset(branding.presetId);
  const pairing = getFontPairing(branding.fontPairing ?? preset.suggestedFontPairing);
  const custom = branding.customTheme ?? {};
  // Unknown style ids fall back to the preset's own scale.
  const scale =
    custom.style && custom.style in SCALE_STYLES ? SCALE_STYLES[custom.style] : preset.scale;

  const light = { ...preset.light };
  const dark = { ...preset.dark };
  for (const { key } of COLOR_KEYS) {
    const lightOverride = custom.light?.[key];
    if (lightOverride) light[key] = lightOverride;
    const darkOverride = custom.dark?.[key];
    if (darkOverride) dark[key] = darkOverride;
  }

  const style: Record<string, string> = {};

  for (const { key, css } of COLOR_KEYS) {
    style[`--tl-${css}`] = light[key];
    style[`--td-${css}`] = dark[key];
  }

  style["--t-radius-lg"] = scale.radiusLg;
  style["--t-radius-xl"] = scale.radiusXl;
  style["--t-radius-2xl"] = scale.radius2xl;
  style["--t-radius-3xl"] = scale.radius3xl;
  style["--t-shadow-card"] = scale.shadowCard;
  style["--t-shadow-elevated"] = scale.shadowElevated;

  style["--t-font-heading"] = pairing.heading;
  style["--t-font-body"] = pairing.body;

  return style as CSSProperties;
}
