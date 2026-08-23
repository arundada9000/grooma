import { describe, expect, it } from "vitest";
import {
  DEFAULT_LOCALE,
  isLocale,
  localizedTextSchema,
  resolveLocalizedText,
} from "./localized-text";

describe("localizedTextSchema", () => {
  it("accepts English only", () => {
    expect(localizedTextSchema.safeParse({ en: "Haircut" }).success).toBe(true);
  });

  it("accepts English and Nepali together", () => {
    const result = localizedTextSchema.safeParse({ en: "Haircut", ne: "कपाल काट्ने" });
    expect(result.success).toBe(true);
  });

  it("rejects missing or empty English", () => {
    expect(localizedTextSchema.safeParse({}).success).toBe(false);
    expect(localizedTextSchema.safeParse({ en: "   " }).success).toBe(false);
  });
});

describe("resolveLocalizedText", () => {
  const value = { en: "Haircut", ne: "कपाल काट्ने" };

  it("returns the requested locale when available", () => {
    expect(resolveLocalizedText(value, "ne")).toBe("कपाल काट्ने");
    expect(resolveLocalizedText(value, "en")).toBe("Haircut");
  });

  it("falls back to English when the locale is missing", () => {
    const englishOnly = { en: "Haircut" };
    expect(resolveLocalizedText(englishOnly, "ne")).toBe("Haircut");
  });

  it("returns null for empty input", () => {
    expect(resolveLocalizedText(null, "en")).toBeNull();
    expect(resolveLocalizedText(undefined, "ne")).toBeNull();
  });
});

describe("isLocale", () => {
  it("narrows supported locales", () => {
    expect(isLocale("ne")).toBe(true);
    expect(isLocale("fr")).toBe(false);
    expect(DEFAULT_LOCALE).toBe("en");
  });
});
