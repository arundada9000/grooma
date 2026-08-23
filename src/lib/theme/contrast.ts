import { getPreset, type ThemeColors, type ThemePreset } from "./presets";

/**
 * WCAG 2.x contrast math. Used to validate presets at test time and to
 * power the custom theme builder later (Phase 11).
 */

function channel(value: number): number {
  const s = value / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(hex: string): number {
  const match = /^#([0-9a-f]{6})$/i.exec(hex.trim());
  if (!match) {
    throw new Error(`Expected a #rrggbb color, received "${hex}"`);
  }
  const int = parseInt(match[1], 16);
  const r = channel((int >> 16) & 255);
  const g = channel((int >> 8) & 255);
  const b = channel(int & 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Composites an rgba() or rgb() color over an opaque background. */
export function compositeOver(fg: string, background: string): string {
  const fgMatch = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)$/i.exec(
    fg.trim(),
  );
  if (!fgMatch) {
    return fg;
  }
  const bg = hexToRgb(background);
  const alpha = fgMatch[4] === undefined ? 1 : Number.parseFloat(fgMatch[4]);
  const mix = (fgPart: number, bgPart: number) => Math.round(fgPart * alpha + bgPart * (1 - alpha));
  const r = mix(Number.parseInt(fgMatch[1], 10), bg.r);
  const g = mix(Number.parseInt(fgMatch[2], 10), bg.g);
  const b = mix(Number.parseInt(fgMatch[3], 10), bg.b);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const int = parseInt(/^#([0-9a-f]{6})$/i.exec(hex.trim())?.[1] ?? "000000", 16);
  return { r: (int >> 16) & 255, g: (int >> 8) & 255, b: int & 255 };
}

export function contrastRatio(colorA: string, colorB: string): number {
  const lumA = relativeLuminance(colorA);
  const lumB = relativeLuminance(colorB);
  const lighter = Math.max(lumA, lumB);
  const darker = Math.min(lumA, lumB);
  return (lighter + 0.05) / (darker + 0.05);
}

const BODY_TEXT_MIN = 4.5;
const UI_COMPONENT_MIN = 3;

export type ContrastIssue = {
  pair: string;
  ratio: number;
  minimum: number;
};

/**
 * Validates one palette. Body text needs 4.5:1; buttons, badges and icons
 * count as UI components at 3:1 per WCAG 1.4.11 and large text rules.
 */
export function checkPalette(palette: ThemeColors, scheme: "light" | "dark"): ContrastIssue[] {
  const issues: ContrastIssue[] = [];
  const solidLabel = compositeOver(palette.label, palette.background);
  const solidSecondary = compositeOver(palette.labelSecondary, palette.background);

  function requireRatio(pair: string, fg: string, bg: string, minimum: number) {
    let ratio: number;
    try {
      ratio = contrastRatio(compositeOver(fg, bg), bg);
    } catch {
      issues.push({ pair: `${pair} (${scheme})`, ratio: Number.NaN, minimum });
      return;
    }
    if (ratio < minimum) {
      issues.push({ pair: `${pair} (${scheme})`, ratio: round(ratio), minimum });
    }
  }

  requireRatio("label on background", solidLabel, palette.background, BODY_TEXT_MIN);
  requireRatio("label secondary on background", solidSecondary, palette.background, BODY_TEXT_MIN);
  requireRatio("on accent", palette.onAccent, palette.accent, UI_COMPONENT_MIN);
  requireRatio("accent on background", palette.accent, palette.background, UI_COMPONENT_MIN);
  requireRatio("on destructive", palette.onDestructive, palette.destructive, UI_COMPONENT_MIN);

  return issues;
}

function round(ratio: number): number {
  return Math.round(ratio * 100) / 100;
}

/** Validates a full preset across both schemes. Empty array means accessible. */
export function checkPreset(preset: ThemePreset): ContrastIssue[] {
  return [...checkPalette(preset.light, "light"), ...checkPalette(preset.dark, "dark")];
}

export function checkPresetById(id: string): ContrastIssue[] {
  return checkPreset(getPreset(id));
}
