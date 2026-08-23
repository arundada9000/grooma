import type { CSSProperties } from "react";
import { getFontPairing } from "./fonts";
import { getPreset, type ThemeColors } from "./presets";

/**
 * Converts shop branding into inline CSS custom properties applied to the
 * html element. Light values ride the --tl- prefix, dark values --td-, and
 * scheme independent scale and font values --t-. globals.css maps them to
 * the semantic tokens; inline styles beat stylesheet defaults without any
 * cascade ordering games.
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

export function buildThemeStyle(branding: {
  presetId?: string;
  fontPairing?: string;
}): CSSProperties {
  const preset = getPreset(branding.presetId);
  const pairing = getFontPairing(branding.fontPairing ?? preset.suggestedFontPairing);

  const style: Record<string, string> = {};

  for (const { key, css } of COLOR_KEYS) {
    style[`--tl-${css}`] = preset.light[key];
    style[`--td-${css}`] = preset.dark[key];
  }

  style["--t-radius-lg"] = preset.scale.radiusLg;
  style["--t-radius-xl"] = preset.scale.radiusXl;
  style["--t-radius-2xl"] = preset.scale.radius2xl;
  style["--t-radius-3xl"] = preset.scale.radius3xl;
  style["--t-shadow-card"] = preset.scale.shadowCard;
  style["--t-shadow-elevated"] = preset.scale.shadowElevated;

  style["--t-font-heading"] = pairing.heading;
  style["--t-font-body"] = pairing.body;

  return style as CSSProperties;
}
