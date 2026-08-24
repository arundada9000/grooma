import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Guest lookup tokens: the customer keeps a random secret in their
 * manage URL; only its SHA-256 is stored. Comparison is constant time.
 */

export function generateLookupToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashLookupToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function lookupTokensMatch(a: string, b: string): boolean {
  const ha = hashLookupToken(a);
  const hb = hashLookupToken(b);
  return ha.length === hb.length && timingSafeEqual(Buffer.from(ha), Buffer.from(hb));
}
