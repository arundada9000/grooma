import { describe, expect, it } from "vitest";
import { cn } from "./cn";

describe("cn", () => {
  it("joins conditional class names", () => {
    expect(cn("px-2", false && "hidden", "py-1")).toBe("px-2 py-1");
  });

  it("lets later Tailwind classes win conflicts", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });

  it("merges component variants with caller overrides", () => {
    const base = "rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium";
    const result = cn(base, "bg-secondary", "text-lg");
    expect(result).toContain("bg-secondary");
    expect(result).toContain("text-lg");
    expect(result).not.toContain("bg-primary");
    expect(result).not.toContain("text-sm");
  });

  it("returns an empty string for no input", () => {
    expect(cn()).toBe("");
  });
});
