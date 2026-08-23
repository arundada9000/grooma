import type { Metadata } from "next";
import Link from "next/link";
import { BarberPole } from "@/components/ui/barber-pole";
import { InlineScript } from "@/components/inline-script";

/**
 * Full-document 404 for URLs that match no route at all, including bad
 * locale prefixes. Bypasses every layout, so it carries its own styles and
 * scheme bootstrap. English only by design.
 */
export const metadata: Metadata = {
  title: "404 | Grooma",
  description: "The page you are looking for does not exist.",
};

const schemeScript = `(function(){try{var s=localStorage.getItem("grooma.scheme");var d=s?s==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches;if(d)document.documentElement.classList.add("dark")}catch(e){}})();`;

export default function GlobalNotFound() {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="flex min-h-full flex-col">
        <InlineScript html={schemeScript} />
        <main className="bg-background text-label flex min-h-dvh flex-col items-center justify-center gap-8 px-6 py-16 text-center">
          <div className="flex items-center gap-5">
            <BarberPole className="h-36 w-7" />
            <div>
              <p className="text-destructive text-sm font-semibold tracking-[0.3em] uppercase">
                404
              </p>
              <h1 className="mt-2 max-w-md text-3xl font-semibold tracking-tight sm:text-4xl">
                This cut isn&apos;t on the menu.
              </h1>
              <p className="text-label-secondary mx-auto mt-3 max-w-sm text-[15px]">
                The page you&apos;re after slipped out with the clippings.
              </p>
            </div>
            <BarberPole className="h-36 w-7" />
          </div>

          <div aria-hidden="true" className="bg-separator h-px w-full max-w-xs" />

          <Link
            href="/en"
            className="bg-accent text-on-accent inline-flex h-11 items-center justify-center rounded-full px-6 font-medium transition-transform active:scale-[0.96]"
          >
            Back to the shop
          </Link>

          <p className="text-label-tertiary max-w-xs text-xs leading-relaxed">
            Grooma &middot; Your grooming, made simple.
          </p>
        </main>
      </body>
    </html>
  );
}
