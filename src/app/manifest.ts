import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { getShopContext } from "@/lib/tenant";
import { buildManifest, fallbackManifest } from "@/lib/pwa/manifest";

/**
 * Request-time so the installed app always carries the live shop
 * brand and theme. Falls back to platform branding without a database.
 */
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  await connection();
  try {
    const shop = await getShopContext();
    return buildManifest({
      name: shop.name,
      description: shop.tagline,
      branding: shop.branding,
    });
  } catch {
    return fallbackManifest();
  }
}
