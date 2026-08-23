import { eq } from "drizzle-orm";
import { db } from "@/db";
import { shops, type Shop } from "@/db/schema";

/**
 * Shop-scoped data access. Every function here takes the shop context
 * explicitly so tenant scoping is impossible to forget at call sites.
 * Feature code must never query tenant tables directly.
 */

export async function getShopBySlug(slug: string): Promise<Shop | null> {
  const rows = await db.select().from(shops).where(eq(shops.slug, slug)).limit(1);
  return rows[0] ?? null;
}
