import type { Metadata, Viewport } from "next";
import type { CSSProperties } from "react";
import { connection } from "next/server";
import {
  Geist,
  Geist_Mono,
  Inter,
  Noto_Sans_Devanagari,
  Oswald,
  Playfair_Display,
} from "next/font/google";
import { getShopContext } from "@/lib/tenant";
import { buildThemeStyle } from "@/lib/theme/theme-css";
import { InlineScript } from "@/components/inline-script";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const notoDevanagari = Noto_Sans_Devanagari({
  variable: "--font-devanagari",
  subsets: ["devanagari"],
});

/* Loaded for the curated font pairings (src/lib/theme/fonts.ts). */
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Grooma",
    template: "%s | Grooma",
  },
  description: "Your grooming, made simple. Book barber appointments in seconds.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f2f2f7" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

/** Applies the stored or system color scheme before first paint. */
const schemeScript = `(function(){try{var s=localStorage.getItem("grooma.scheme");var d=s?s==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches;if(d)document.documentElement.classList.add("dark")}catch(e){}})();`;

/**
 * Resolves the active shop's branding and converts it to inline theme
 * variables. Falls back to the baseline palette when no database is
 * reachable so the app always renders.
 */
async function loadThemeStyle(): Promise<CSSProperties | undefined> {
  try {
    await connection(); // theme comes from the database: render per request, never bake into a prerender
    const shop = await getShopContext();
    return buildThemeStyle(shop.branding);
  } catch {
    return undefined;
  }
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const themeStyle = await loadThemeStyle();

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${notoDevanagari.variable} ${inter.variable} ${oswald.variable} ${playfair.variable} h-full antialiased`}
      style={themeStyle}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col">
        <InlineScript html={schemeScript} />
        {children}
      </body>
    </html>
  );
}
