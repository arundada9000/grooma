import { describe, expect, it } from "vitest";
import { HAPTIC_PATTERN_NAMES, hapticPattern } from "./haptics";

describe("haptics", () => {
  it("maps every known pattern to a non empty vibration", () => {
    for (const name of HAPTIC_PATTERN_NAMES) {
      const pattern = hapticPattern(name);
      expect(pattern.length).toBeGreaterThan(0);
      for (const ms of pattern) {
        expect(ms).toBeGreaterThan(0);
      }
    }
  });

  it("keeps patterns short enough to feel like taps", () => {
    expect(hapticPattern("selection")[0]).toBeLessThanOrEqual(10);
    expect(hapticPattern("light")[0]).toBeLessThanOrEqual(15);
  });
});
