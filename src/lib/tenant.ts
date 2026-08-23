import "server-only";
import { cache } from "react";
import { getShopBySlug } from "@/db/repositories/shops";
import type { Shop } from "@/db/schema";

/**
 * Single place that resolves the active shop for this deployment.
 * Today: the shop whose slug matches DEFAULT_SHOP_SLUG.
 * Later (multi-tenant mode): resolve by subdomain, host, or path segment
 * here and every consumer keeps working unchanged. See AD-01.
 */

async function resolveShop(): Promise<Shop> {
  const slug = process.env.DEFAULT_SHOP_SLUG;

  if (!slug) {
    throw new Error("DEFAULT_SHOP_SLUG is not configured");
  }

  const shop = await getShopBySlug(slug);

  if (!shop) {
    throw new Error(`No shop found for slug "${slug}". Run the seed script.`);
  }

  return shop;
}

/** Request-scoped cached shop context. */
export const getShopContext = cache(resolveShop);
