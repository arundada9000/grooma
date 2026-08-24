import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { rateLimit, resetRateLimits } from "./rate-limit";

describe("rate limiter", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    resetRateLimits();
  });
  afterEach(() => vi.useRealTimers());

  it("allows up to the limit then blocks within the window", () => {
    const start = Date.now();
    for (let i = 0; i < 5; i++) {
      expect(rateLimit("ip:create", 5, 60_000, start)).toBe(true);
    }
    expect(rateLimit("ip:create", 5, 60_000, start + 1000)).toBe(false);
    // A different key is unaffected.
    expect(rateLimit("other:create", 5, 60_000, start + 1000)).toBe(true);
  });

  it("frees capacity once the window slides past old hits", () => {
    const start = Date.now();
    for (let i = 0; i < 3; i++) rateLimit("k", 3, 10_000, start);
    expect(rateLimit("k", 3, 10_000, start + 5000)).toBe(false);
    expect(rateLimit("k", 3, 10_000, start + 10_001)).toBe(true);
  });
});
