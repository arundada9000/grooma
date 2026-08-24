import type { ReactNode } from "react";
import { getShopContext } from "@/lib/tenant";
import { SiteFooter, SiteHeader } from "@/components/site/site-header";

/**
 * Chrome for customer facing pages. Admin and sign-in keep their own
 * layouts by living outside this route group.
 */
export default async function PublicLayout({ children }: { children: ReactNode }) {
  const shop = await getShopContext();

  return (
    <>
      <SiteHeader shopName={shop.name} shortName={shop.shortName} />
      <main className="mx-auto w-full max-w-3xl flex-1">{children}</main>
      <SiteFooter shopName={shop.name} />
    </>
  );
}
