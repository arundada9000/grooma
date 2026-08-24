import { describe, expect, it } from "vitest";
import { PRESETS } from "./presets";
import { buildThemeStyle } from "./theme-css";

describe("buildThemeStyle", () => {
  it("emits light, dark and scale variables for a preset", () => {
    const style = buildThemeStyle({ presetId: "minimal" }) as Record<string, string>;
    expect(style["--tl-background"]).toBe("#fafafa");
    expect(style["--td-card"]).toBe("#161616");
    expect(style["--t-radius-2xl"]).toBe("0.75rem");
    expect(Object.keys(style).filter((key) => key.startsWith("--tl-")).length).toBe(16);
    expect(Object.keys(style).filter((key) => key.startsWith("--td-")).length).toBe(16);
  });

  it("falls back to the classic preset for unknown or missing ids", () => {
    const style = buildThemeStyle({ presetId: "does-not-exist" }) as Record<string, string>;
    expect(style["--tl-accent"]).toBe(PRESETS["classic-barbershop"].light.accent);
    const empty = buildThemeStyle({}) as Record<string, string>;
    expect(empty["--tl-accent"]).toBe(PRESETS["classic-barbershop"].light.accent);
  });

  it("maps font pairings with the preset suggestion as default", () => {
    const suggested = buildThemeStyle({ presetId: "editorial" }) as Record<string, string>;
    expect(suggested["--t-font-heading"]).toBe("var(--font-playfair)");

    const explicit = buildThemeStyle({
      presetId: "editorial",
      fontPairing: "oswald-inter",
    }) as Record<string, string>;
    expect(explicit["--t-font-heading"]).toBe("var(--font-oswald)");
    expect(explicit["--t-font-body"]).toBe("var(--font-inter)");
  });

  it("covers every seeded theme preset id", () => {
    for (const id of Object.keys(PRESETS)) {
      const style = buildThemeStyle({ presetId: id }) as Record<string, string>;
      expect(style["--tl-label"]).toBeTruthy();
      expect(style["--td-label"]).toBeTruthy();
    }
  });

  it("merges custom color and scale overrides on top of the preset", () => {
    const style = buildThemeStyle({
      presetId: "minimal",
      customTheme: {
        light: { accent: "#123456" },
        dark: { background: "#0b0b0d" },
        style: "deep",
      },
    }) as Record<string, string>;
    expect(style["--tl-accent"]).toBe("#123456");
    expect(style["--td-background"]).toBe("#0b0b0d");
    // Untouched keys keep their preset values.
    expect(style["--tl-card"]).toBe(PRESETS.minimal.light.card);
    expect(style["--td-card"]).toBe(PRESETS.minimal.dark.card);
    // Style override swaps the scale family.
    expect(style["--t-radius-3xl"]).toBe("1.75rem");
  });

  it("ignores unknown style ids and keeps the preset scale", () => {
    const style = buildThemeStyle({
      presetId: "minimal",
      customTheme: { style: "bogus" as never },
    }) as Record<string, string>;
    expect(style["--t-radius-2xl"]).toBe("0.75rem");
  });
});
