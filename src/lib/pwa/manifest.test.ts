import { describe, expect, it } from "vitest";
import { PRESETS } from "@/lib/theme/presets";
import { buildManifest, fallbackManifest } from "./manifest";

describe("buildManifest", () => {
  it("leads with the shop brand and resolves theme colors from branding", () => {
    const manifest = buildManifest({
      name: "Demo Classic Barbershop",
      description: "Traditional craft, modern comfort.",
      branding: { presetId: "ocean" },
    });

    expect(manifest.name).toBe("Demo Classic Barbershop");
    expect(manifest.short_name).toBe("Demo Classic");
    expect(manifest.description).toBe("Traditional craft, modern comfort.");
    expect(manifest.theme_color).toBe(PRESETS["ocean"].light.accent);
    expect(manifest.background_color).toBe(PRESETS["ocean"].light.background);
    expect(manifest.display).toBe("standalone");
    expect(manifest.start_url).toBe("/");
    expect(manifest.scope).toBe("/");
  });

  it("declares any and maskable icons at installable sizes", () => {
    const manifest = buildManifest({
      name: "Grooma",
      branding: { presetId: "classic-barbershop" },
    });

    const purposes = manifest.icons.map((icon) => icon.purpose);
    expect(purposes.filter((p) => p === "any")).toHaveLength(2);
    expect(purposes.filter((p) => p === "maskable")).toHaveLength(2);
    for (const size of ["192x192", "512x512"]) {
      expect(manifest.icons.some((icon) => icon.sizes === size)).toBe(true);
    }
    for (const icon of manifest.icons) {
      expect(icon.type).toBe("image/png");
      expect(icon.src.startsWith("/icons/")).toBe(true);
    }
  });

  it("carries the spec section 41 shortcuts", () => {
    const manifest = fallbackManifest();
    expect(manifest.shortcuts.map((s) => s.url)).toEqual(["/en/book", "/en/manage"]);
    expect(manifest.shortcuts.every((s) => s.name.length > 0 && s.icons.length > 0)).toBe(true);
  });

  it("falls back cleanly without a description or with blank input", () => {
    const noDescription = buildManifest({ name: "Kathmandu Cuts", branding: {} });
    expect(noDescription.description).toBeUndefined();

    const blank = buildManifest({ name: "   ", branding: {} });
    expect(blank.name).toBe("Grooma");
  });
});
