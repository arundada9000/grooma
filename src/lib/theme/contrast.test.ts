import { describe, expect, it } from "vitest";
import { contrastRatio, compositeOver, relativeLuminance } from "./contrast";
import { PRESETS, PRESET_IDS } from "./presets";

describe("contrast math", () => {
  it("computes known WCAG ratios", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 1);
    expect(contrastRatio("#ffffff", "#ffffff")).toBeCloseTo(1, 5);
    expect(relativeLuminance("#000000")).toBe(0);
    expect(relativeLuminance("#ffffff")).toBeCloseTo(1, 5);
  });

  it("composites translucent foregrounds over backgrounds", () => {
    expect(compositeOver("rgba(0, 0, 0, 0.5)", "#ffffff")).toBe("#808080");
    expect(compositeOver("rgba(255, 0, 0, 0.25)", "#000000")).toBe("#400000");
    expect(compositeOver("#123456", "#ffffff")).toBe("#123456");
  });

  it("keeps every preset readable in both schemes", () => {
    const failures: string[] = [];
    for (const id of PRESET_IDS) {
      const preset = PRESETS[id];
      for (const scheme of ["light", "dark"] as const) {
        const p = preset[scheme];
        const bg = p.background;
        const label = compositeOver(p.label, bg);
        const secondary = compositeOver(p.labelSecondary, bg);
        if (contrastRatio(label, bg) < 4.5) {
          failures.push(`${id} ${scheme}: label ${contrastRatio(label, bg).toFixed(2)}`);
        }
        if (contrastRatio(secondary, bg) < 4.5) {
          failures.push(
            `${id} ${scheme}: labelSecondary ${contrastRatio(secondary, bg).toFixed(2)}`,
          );
        }
        if (contrastRatio(p.onAccent, p.accent) < 3) {
          failures.push(
            `${id} ${scheme}: onAccent ${contrastRatio(p.onAccent, p.accent).toFixed(2)}`,
          );
        }
        if (contrastRatio(p.accent, bg) < 2.2) {
          failures.push(
            `${id} ${scheme}: accent visibility ${contrastRatio(p.accent, bg).toFixed(2)}`,
          );
        }
      }
    }
    expect(failures).toEqual([]);
  });
});
