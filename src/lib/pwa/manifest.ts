/**
 * Pure web app manifest builder. The shop's own brand leads (the
 * platform name never replaces it); colors come from the effective
 * theme palettes so an installed app matches the site.
 */
import { resolvePalettes } from "@/lib/theme/theme-css";

export type ManifestBranding = {
  presetId?: string;
  customTheme?: {
    light?: Record<string, unknown>;
    dark?: Record<string, unknown>;
  };
};

export type ManifestInput = {
  name: string;
  description?: string | null;
  branding: ManifestBranding;
};

export type WebAppManifest = {
  name: string;
  short_name: string;
  description?: string;
  start_url: string;
  scope: string;
  display: "standalone";
  lang: string;
  background_color: string;
  theme_color: string;
  icons: Array<{
    src: string;
    sizes: string;
    type: string;
    purpose: "any" | "maskable" | "monochrome";
  }>;
  shortcuts: Array<{
    name: string;
    url: string;
    icons: Array<{ src: string; sizes: string; type: string }>;
  }>;
};

const ICON = (src: string, size: number, purpose: "any" | "maskable") => ({
  src,
  sizes: `${size}x${size}`,
  type: "image/png",
  purpose,
});

/** Spec section 41 shortcuts; English paths, locale negotiation takes over. */
const SHORTCUTS = [
  { name: "Book appointment", url: "/en/book" },
  { name: "My appointment", url: "/en/manage" },
] as const;

export function buildManifest(input: ManifestInput): WebAppManifest {
  const { light } = resolvePalettes(input.branding);
  const name = input.name.trim() || "Grooma";
  return {
    name,
    short_name: name.length <= 12 ? name : name.slice(0, 12).trim(),
    ...(input.description?.trim() ? { description: input.description.trim() } : {}),
    start_url: "/",
    scope: "/",
    display: "standalone",
    lang: "en",
    background_color: light.background,
    theme_color: light.accent,
    icons: [
      ICON("/icons/icon-192.png", 192, "any"),
      ICON("/icons/icon-512.png", 512, "any"),
      ICON("/icons/maskable-192.png", 192, "maskable"),
      ICON("/icons/maskable-512.png", 512, "maskable"),
    ],
    shortcuts: SHORTCUTS.map((shortcut) => ({
      ...shortcut,
      icons: [ICON("/icons/icon-192.png", 192, "any")],
    })),
  };
}

/** Baseline manifest when no database is reachable. */
export function fallbackManifest(): WebAppManifest {
  return buildManifest({
    name: "Grooma",
    description: "Your grooming, made simple.",
    branding: { presetId: "classic-barbershop" },
  });
}
