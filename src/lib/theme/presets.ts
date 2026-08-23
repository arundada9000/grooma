/**
 * Theme presets. Every value here is emitted as CSS custom properties at
 * request time (see theme-css.ts) so the whole surface restyles from shop
 * branding alone. Components must never hardcode hex values.
 */

export type ThemeColors = {
  background: string;
  card: string;
  inset: string;
  backdrop: string;
  label: string;
  labelSecondary: string;
  labelTertiary: string;
  separator: string;
  accent: string;
  accentSoft: string;
  onAccent: string;
  destructive: string;
  destructiveSoft: string;
  onDestructive: string;
  success: string;
  warning: string;
};

export type ThemeScale = {
  radiusLg: string;
  radiusXl: string;
  radius2xl: string;
  radius3xl: string;
  shadowCard: string;
  shadowElevated: string;
};

export type ThemePreset = {
  id: string;
  name: string;
  suggestedFontPairing: "geist" | "oswald-inter" | "playfair-inter";
  light: ThemeColors;
  dark: ThemeColors;
  scale: ThemeScale;
};

const STANDARD_SCALE: ThemeScale = {
  radiusLg: "0.5rem",
  radiusXl: "0.75rem",
  radius2xl: "1rem",
  radius3xl: "1.5rem",
  shadowCard: "0 1px 2px rgb(0 0 0 / 0.04), 0 4px 16px rgb(0 0 0 / 0.04)",
  shadowElevated: "0 8px 30px rgb(0 0 0 / 0.12)",
};

const SOFT_SCALE: ThemeScale = {
  radiusLg: "0.375rem",
  radiusXl: "0.5rem",
  radius2xl: "0.75rem",
  radius3xl: "1rem",
  shadowCard: "0 1px 2px rgb(0 0 0 / 0.03)",
  shadowElevated: "0 4px 16px rgb(0 0 0 / 0.08)",
};

const DEEP_SCALE: ThemeScale = {
  radiusLg: "0.5rem",
  radiusXl: "0.875rem",
  radius2xl: "1.25rem",
  radius3xl: "1.75rem",
  shadowCard: "0 2px 4px rgb(0 0 0 / 0.35)",
  shadowElevated: "0 10px 40px rgb(0 0 0 / 0.6)",
};

function colors(overrides: Partial<ThemeColors>, base: ThemeColors): ThemeColors {
  return { ...base, ...overrides };
}

const LIGHT_BASE: ThemeColors = {
  background: "#f2f2f7",
  card: "#ffffff",
  inset: "rgba(118, 118, 128, 0.12)",
  backdrop: "rgba(0, 0, 0, 0.4)",
  label: "#111113",
  labelSecondary: "rgba(60, 60, 67, 0.66)",
  labelTertiary: "rgba(60, 60, 67, 0.33)",
  separator: "rgba(60, 60, 67, 0.14)",
  accent: "#006edb",
  accentSoft: "rgba(0, 110, 219, 0.12)",
  onAccent: "#ffffff",
  destructive: "#d92c20",
  destructiveSoft: "rgba(217, 44, 32, 0.12)",
  onDestructive: "#ffffff",
  success: "#248a3d",
  warning: "#b25000",
};

const DARK_BASE: ThemeColors = {
  background: "#0a0a0c",
  card: "#1c1c1e",
  inset: "rgba(120, 120, 128, 0.26)",
  backdrop: "rgba(0, 0, 0, 0.55)",
  label: "#f5f5f7",
  labelSecondary: "rgba(235, 235, 245, 0.66)",
  labelTertiary: "rgba(235, 235, 245, 0.32)",
  separator: "rgba(84, 84, 88, 0.55)",
  accent: "#3f9bff",
  accentSoft: "rgba(63, 155, 255, 0.22)",
  onAccent: "#071018",
  destructive: "#ff6b61",
  destructiveSoft: "rgba(255, 107, 97, 0.18)",
  onDestructive: "#2a0503",
  success: "#4cd964",
  warning: "#ffb340",
};

export const PRESETS: Record<string, ThemePreset> = {
  "classic-barbershop": {
    id: "classic-barbershop",
    name: "Classic Barbershop",
    suggestedFontPairing: "oswald-inter",
    light: colors(
      {
        background: "#f6f3ee",
        card: "#fffdf9",
        inset: "rgba(74, 56, 36, 0.09)",
        backdrop: "rgba(28, 20, 12, 0.45)",
        label: "#231a10",
        labelSecondary: "rgba(74, 58, 38, 0.78)",
        labelTertiary: "rgba(74, 58, 38, 0.4)",
        separator: "rgba(74, 58, 38, 0.16)",
        accent: "#84572a",
        accentSoft: "rgba(132, 87, 42, 0.13)",
      },
      LIGHT_BASE,
    ),
    dark: colors(
      {
        background: "#14100c",
        card: "#201a14",
        inset: "rgba(222, 189, 152, 0.11)",
        backdrop: "rgba(0, 0, 0, 0.6)",
        label: "#f3ece1",
        labelSecondary: "rgba(240, 228, 210, 0.76)",
        labelTertiary: "rgba(240, 228, 210, 0.34)",
        separator: "rgba(230, 208, 178, 0.16)",
        accent: "#cf9d61",
        accentSoft: "rgba(207, 157, 97, 0.18)",
        onAccent: "#241708",
        success: "#5fd879",
      },
      DARK_BASE,
    ),
    scale: DEEP_SCALE,
  },

  midnight: {
    id: "midnight",
    name: "Midnight",
    suggestedFontPairing: "geist",
    light: colors(
      {
        background: "#10141f",
        card: "#171d2c",
        inset: "rgba(125, 155, 225, 0.13)",
        backdrop: "rgba(2, 5, 12, 0.6)",
        label: "#e9eef9",
        labelSecondary: "rgba(214, 224, 245, 0.72)",
        labelTertiary: "rgba(214, 224, 245, 0.34)",
        separator: "rgba(160, 180, 220, 0.16)",
        accent: "#96abff",
        accentSoft: "rgba(150, 171, 255, 0.16)",
        onAccent: "#0a1024",
        destructive: "#ff857c",
        destructiveSoft: "rgba(255, 133, 124, 0.16)",
        onDestructive: "#26070a",
        success: "#4fdb85",
        warning: "#ffc061",
      },
      LIGHT_BASE,
    ),
    dark: colors(
      {
        background: "#070a12",
        card: "#0e1422",
        inset: "rgba(125, 155, 225, 0.16)",
        separator: "rgba(140, 165, 215, 0.15)",
        accent: "#a3b6ff",
        accentSoft: "rgba(163, 182, 255, 0.2)",
      },
      DARK_BASE,
    ),
    scale: DEEP_SCALE,
  },

  minimal: {
    id: "minimal",
    name: "Minimal",
    suggestedFontPairing: "geist",
    light: colors(
      {
        background: "#fafafa",
        card: "#ffffff",
        inset: "#efefef",
        backdrop: "rgba(0, 0, 0, 0.35)",
        label: "#111111",
        labelSecondary: "rgba(17, 17, 17, 0.62)",
        labelTertiary: "rgba(17, 17, 17, 0.34)",
        separator: "#e5e5e5",
        accent: "#111111",
        accentSoft: "rgba(0, 0, 0, 0.06)",
      },
      LIGHT_BASE,
    ),
    dark: colors(
      {
        background: "#0a0a0a",
        card: "#161616",
        inset: "#232323",
        separator: "#2e2e2e",
        accent: "#ededed",
        accentSoft: "rgba(237, 237, 237, 0.1)",
        onAccent: "#111111",
      },
      DARK_BASE,
    ),
    scale: SOFT_SCALE,
  },

  copper: {
    id: "copper",
    name: "Copper",
    suggestedFontPairing: "oswald-inter",
    light: colors(
      {
        background: "#f5f1ec",
        card: "#fdfaf6",
        inset: "rgba(93, 64, 38, 0.09)",
        backdrop: "rgba(30, 18, 10, 0.45)",
        label: "#2b1d10",
        labelSecondary: "rgba(93, 68, 44, 0.78)",
        labelTertiary: "rgba(93, 68, 44, 0.4)",
        separator: "rgba(93, 68, 44, 0.16)",
        accent: "#9c5122",
        accentSoft: "rgba(156, 81, 34, 0.13)",
      },
      LIGHT_BASE,
    ),
    dark: colors(
      {
        background: "#161009",
        card: "#221912",
        inset: "rgba(230, 180, 130, 0.11)",
        backdrop: "rgba(0, 0, 0, 0.58)",
        label: "#f5ede3",
        labelSecondary: "rgba(240, 225, 205, 0.76)",
        labelTertiary: "rgba(240, 225, 205, 0.34)",
        separator: "rgba(235, 210, 180, 0.16)",
        accent: "#e29a5e",
        accentSoft: "rgba(226, 154, 94, 0.18)",
        onAccent: "#241203",
      },
      DARK_BASE,
    ),
    scale: DEEP_SCALE,
  },

  emerald: {
    id: "emerald",
    name: "Emerald",
    suggestedFontPairing: "geist",
    light: colors(
      {
        background: "#f2f7f4",
        card: "#ffffff",
        inset: "rgba(15, 90, 60, 0.09)",
        backdrop: "rgba(6, 30, 20, 0.45)",
        label: "#10241a",
        labelSecondary: "rgba(25, 70, 50, 0.76)",
        labelTertiary: "rgba(25, 70, 50, 0.38)",
        separator: "rgba(25, 70, 50, 0.15)",
        accent: "#0e7a54",
        accentSoft: "rgba(14, 122, 84, 0.13)",
      },
      LIGHT_BASE,
    ),
    dark: colors(
      {
        background: "#0a120e",
        card: "#13201a",
        inset: "rgba(140, 220, 180, 0.11)",
        label: "#e9f5ee",
        labelSecondary: "rgba(220, 240, 228, 0.74)",
        labelTertiary: "rgba(220, 240, 228, 0.32)",
        separator: "rgba(190, 230, 205, 0.15)",
        accent: "#46d68f",
        accentSoft: "rgba(70, 214, 143, 0.16)",
        onAccent: "#06231a",
      },
      DARK_BASE,
    ),
    scale: STANDARD_SCALE,
  },

  ocean: {
    id: "ocean",
    name: "Ocean",
    suggestedFontPairing: "geist",
    light: colors(
      {
        background: "#f0f5f7",
        card: "#ffffff",
        inset: "rgba(20, 80, 110, 0.09)",
        backdrop: "rgba(4, 24, 36, 0.45)",
        label: "#0e2029",
        labelSecondary: "rgba(30, 75, 95, 0.76)",
        labelTertiary: "rgba(30, 75, 95, 0.38)",
        separator: "rgba(30, 75, 95, 0.15)",
        accent: "#0d6e8c",
        accentSoft: "rgba(13, 110, 140, 0.12)",
      },
      LIGHT_BASE,
    ),
    dark: colors(
      {
        background: "#081117",
        card: "#101c24",
        inset: "rgba(120, 190, 220, 0.11)",
        label: "#e9f3f7",
        labelSecondary: "rgba(215, 235, 245, 0.74)",
        labelTertiary: "rgba(215, 235, 245, 0.32)",
        separator: "rgba(185, 220, 235, 0.15)",
        accent: "#4cc7e0",
        accentSoft: "rgba(76, 199, 224, 0.16)",
        onAccent: "#04252e",
      },
      DARK_BASE,
    ),
    scale: STANDARD_SCALE,
  },

  editorial: {
    id: "editorial",
    name: "Editorial",
    suggestedFontPairing: "playfair-inter",
    light: colors(
      {
        background: "#faf9f6",
        card: "#ffffff",
        inset: "rgba(20, 20, 20, 0.06)",
        backdrop: "rgba(15, 15, 15, 0.42)",
        label: "#141414",
        labelSecondary: "rgba(20, 20, 20, 0.64)",
        labelTertiary: "rgba(20, 20, 20, 0.35)",
        separator: "rgba(20, 20, 20, 0.14)",
        accent: "#1a1a1a",
        accentSoft: "rgba(0, 0, 0, 0.06)",
      },
      LIGHT_BASE,
    ),
    dark: colors(
      {
        background: "#0c0c0c",
        card: "#181817",
        inset: "rgba(235, 232, 225, 0.09)",
        label: "#f2f0ea",
        labelSecondary: "rgba(235, 232, 225, 0.64)",
        labelTertiary: "rgba(235, 232, 225, 0.32)",
        separator: "rgba(225, 222, 215, 0.15)",
        accent: "#ece9e2",
        accentSoft: "rgba(236, 233, 226, 0.1)",
        onAccent: "#141414",
      },
      DARK_BASE,
    ),
    scale: SOFT_SCALE,
  },
};

export const PRESET_IDS = Object.keys(PRESETS);

/** Unknown ids fall back here so a bad database value can never blank the app. */
export const FALLBACK_PRESET_ID = "classic-barbershop";

export function getPreset(id: string | undefined | null): ThemePreset {
  return PRESETS[id ?? ""] ?? PRESETS[FALLBACK_PRESET_ID];
}
