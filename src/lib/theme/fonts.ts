/**
 * Curated font pairings. Fonts are preloaded once in layout.tsx via
 * next/font; a pairing just points the theme's heading and body variables
 * at the preloaded faces. Keeping the list short keeps the font bundle lean.
 */
export type FontPairingId = "geist" | "oswald-inter" | "playfair-inter";

export const FONT_PAIRINGS: Record<FontPairingId, { name: string; heading: string; body: string }> =
  {
    geist: {
      name: "Geist",
      heading: "var(--font-geist-sans)",
      body: "var(--font-geist-sans)",
    },
    "oswald-inter": {
      name: "Oswald and Inter",
      heading: "var(--font-oswald)",
      body: "var(--font-inter)",
    },
    "playfair-inter": {
      name: "Playfair Display and Inter",
      heading: "var(--font-playfair)",
      body: "var(--font-inter)",
    },
  };

export const FALLBACK_FONT_PAIRING: FontPairingId = "geist";

export function getFontPairing(id: string | undefined | null) {
  return (
    FONT_PAIRINGS[(id ?? FALLBACK_FONT_PAIRING) as FontPairingId] ??
    FONT_PAIRINGS[FALLBACK_FONT_PAIRING]
  );
}
