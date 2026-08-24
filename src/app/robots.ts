import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/seo/site-url";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Admin chrome, APIs and token-bearing manage URLs are private.
        disallow: ["/api/", "/*/manage", "/*/manage/", "/admin"],
      },
    ],
    sitemap: `${getSiteUrl()}/sitemap.xml`,
  };
}
