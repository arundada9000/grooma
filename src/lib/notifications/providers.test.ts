import { describe, expect, it } from "vitest";
import { resolveEmailChannel } from "./providers";

describe("resolveEmailChannel", () => {
  it("falls back to the console provider without an API key", () => {
    const channel = resolveEmailChannel({});
    expect(channel.provider.name).toBe("console");
  });

  it("selects Resend when a key is present and honors EMAIL_FROM", () => {
    const channel = resolveEmailChannel({
      RESEND_API_KEY: "re_test_123",
      EMAIL_FROM: "Grooma <hi@grooma.test>",
    });
    expect(channel.provider.name).toBe("resend");
    expect(channel.from).toBe("Grooma <hi@grooma.test>");
  });

  it("uses the default from address when EMAIL_FROM is blank", () => {
    const channel = resolveEmailChannel({ RESEND_API_KEY: "re_test_123", EMAIL_FROM: "   " });
    expect(channel.from).toContain("Grooma <");
  });
});
