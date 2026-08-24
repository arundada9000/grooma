import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ErrorSurface } from "@/components/error-surface";
import { translate } from "@/i18n/resolve";
import { InlineScript } from "@/components/inline-script";
import { SCHEME_SCRIPT } from "@/lib/scheme-script";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/**
 * Full document 404 for URLs that match no route at all, including bad
 * locale prefixes. Bypasses every layout, so it owns its html, token
 * stylesheet and scheme bootstrap. English only by design.
 */
export const metadata: Metadata = {
  title: "404 | Grooma",
  description: "The page you are looking for does not exist.",
};

export default function GlobalNotFound() {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col">
        <InlineScript html={SCHEME_SCRIPT} />
        <ErrorSurface
          className="flex-1"
          eyebrow="404"
          title={translate("en", "notFound.title")}
          subtitle={translate("en", "notFound.subtitle")}
          actionLabel={translate("en", "notFound.action")}
          actionHref="/en"
        />
      </body>
    </html>
  );
}
