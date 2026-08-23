import { describe, expect, it } from "vitest";
import { DEFAULT_LOCALE, isLocale, localeFromPathname } from "./config";
import { formatCurrency, formatDate } from "./format";
import { buildAlternates } from "./hreflang";
import { translate } from "./resolve";

describe("locale config", () => {
  it("recognizes supported locales only", () => {
    expect(isLocale("en")).toBe(true);
    expect(isLocale("ne")).toBe(true);
    expect(isLocale("fr")).toBe(false);
    expect(isLocale(undefined)).toBe(false);
  });

  it("extracts the locale from a pathname", () => {
    expect(localeFromPathname("/en/style")).toBe("en");
    expect(localeFromPathname("/ne")).toBe("ne");
    expect(localeFromPathname("/style")).toBeUndefined();
    expect(localeFromPathname("/")).toBeUndefined();
  });

  it("defaults to English", () => {
    expect(DEFAULT_LOCALE).toBe("en");
  });
});

describe("translate", () => {
  it("resolves nested keys per locale", () => {
    expect(translate("en", "home.tagline")).toBe("Your grooming, made simple.");
    expect(translate("ne", "admin.signOut")).toBe("साइन आउट");
  });

  it("falls back to English when a key is missing in the locale", () => {
    expect(translate("ne", "languageSwitcher.en")).toBe("English");
  });

  it("returns the key itself when nothing resolves", () => {
    expect(translate("en", "no.such.key" as never)).toBe("no.such.key");
  });

  it("keeps template placeholders intact through lookup", () => {
    expect(translate("en", "meta.titleTemplate")).toBe("%s | Grooma");
  });
});

describe("formatting", () => {
  const moment = new Date("2026-03-15T14:30:00+05:45");

  it("formats dates in both locales with the Kathmandu zone", () => {
    const english = formatDate(moment, "en", { dateStyle: "medium" });
    const nepali = formatDate(moment, "ne", { dateStyle: "medium" });
    expect(english).toMatch(/Mar/);
    expect(nepali).toMatch(/[०-९]/);
  });

  it("renders NPR from integer paisa", () => {
    const english = formatCurrency(125000, "en");
    expect(english.replace(/[\s\u00a0]/g, "")).toContain("1,250.00");
    const nepali = formatCurrency(125000, "ne");
    expect(nepali).toMatch(/[०-९]/);
  });
});

describe("hreflang alternates", () => {
  it("builds a language map for a path", () => {
    const { languages } = buildAlternates("/style", "https://grooma.test");
    expect(languages.en).toBe("https://grooma.test/en/style");
    expect(languages.ne).toBe("https://grooma.test/ne/style");
  });

  it("handles the root path", () => {
    const { languages } = buildAlternates("/");
    expect(languages.en).toBe("/en");
    expect(languages.ne).toBe("/ne");
  });
});
