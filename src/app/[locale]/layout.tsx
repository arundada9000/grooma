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
import { buildThemeStyle, resolvePalettes } from "@/lib/theme/theme-css";
import { InlineScript } from "@/components/inline-script";
import { SwRegister } from "@/components/pwa/sw-register";
import { LocaleProvider } from "@/i18n/client";
import { getLocale, getTranslator } from "@/i18n/server";
import { isLocale } from "@/i18n/config";
import { SCHEME_SCRIPT } from "@/lib/scheme-script";
import { getSiteUrl } from "@/lib/seo/site-url";
import { notFound } from "next/navigation";
import "../globals.css";

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

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslator();
  return {
    // Anchors every relative OG/canonical URL Next resolves.
    metadataBase: new URL(getSiteUrl()),
    title: {
      default: t("meta.titleDefault"),
      template: t("meta.titleTemplate"),
    },
    description: t("meta.description"),
    appleWebApp: {
      capable: true,
      statusBarStyle: "black-translucent",
      title: "Grooma",
    },
    // Next 16 emits only mobile-web-app-capable; pre-17.4 iOS still
    // reads the legacy name (spec 40).
    other: {
      "apple-mobile-web-app-capable": "yes",
    },
    icons: {
      icon: [{ url: "/icons/icon-192.png", type: "image/png", sizes: "192x192" }],
      apple: "/icons/apple-touch-icon.png",
    },
  };
}

/**
 * Theme color follows the shop's live branding (spec: theme color sync
 * from shop data), falling back to the baseline surfaces.
 */
export async function generateViewport(): Promise<Viewport> {
  let light = "#f2f2f7";
  let dark = "#000000";
  try {
    const shop = await getShopContext();
    const palettes = resolvePalettes(shop.branding);
    light = palettes.light.background;
    dark = palettes.dark.background;
  } catch {
    // Baseline values above keep the app correct without a database.
  }
  return {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
    viewportFit: "cover",
    themeColor: [
      { media: "(prefers-color-scheme: light)", color: light },
      { media: "(prefers-color-scheme: dark)", color: dark },
    ],
  };
}

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

export default async function RootLayout({ children }: LayoutProps<"/[locale]">) {
  const requested = await getLocale();
  if (!isLocale(requested)) {
    notFound();
  }
  const locale = requested;
  const themeStyle = await loadThemeStyle();

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} ${notoDevanagari.variable} ${inter.variable} ${oswald.variable} ${playfair.variable} h-full antialiased`}
      style={themeStyle}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col">
        <InlineScript html={SCHEME_SCRIPT} />
        <LocaleProvider locale={locale}>{children}</LocaleProvider>
        <SwRegister />
      </body>
    </html>
  );
}
