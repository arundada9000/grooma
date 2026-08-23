import { eq } from "drizzle-orm";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/db";
import { shops } from "@/db/schema";

/** Resolves the shop this deployment serves. */
async function resolveShopId(): Promise<string> {
  const slug = process.env.DEFAULT_SHOP_SLUG;
  if (!slug) {
    throw new Error("DEFAULT_SHOP_SLUG is not set");
  }
  const [shop] = await db.select({ id: shops.id }).from(shops).where(eq(shops.slug, slug)).limit(1);
  if (!shop) {
    throw new Error(`No shop found for slug "${slug}"`);
  }
  return shop.id;
}

/**
 * No "server-only" import here on purpose: scripts like db/seed.ts run under
 * plain Node where that package throws, and they need this instance to
 * bootstrap the demo owner account.
 */
export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    usePlural: true,
  }),
  emailAndPassword: {
    enabled: true,
  },
  user: {
    additionalFields: {
      shopId: {
        type: "string",
        input: false,
      },
      role: {
        type: "string",
        input: false,
      },
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => ({
          data: {
            ...user,
            shopId: await resolveShopId(),
            role: "BARBER",
          },
        }),
      },
    },
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
  },
  plugins: [nextCookies()],
});

export type AuthSession = typeof auth.$Infer.Session;
