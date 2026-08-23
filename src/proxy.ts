import { NextResponse, type NextRequest } from "next/server";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale } from "@/i18n/config";

/**
 * Edge-safe gate for /admin: cookie presence only. The real authorization
 * (valid session, OWNER role, shop scoping) runs server-side via
 * requireUser/requireOwner on every admin page and action.
 */
const SESSION_COOKIE = "better-auth.session_token";

/**
 * Locale negotiation order: explicit cookie, then Accept-Language quality
 * values, then the default. Hand rolled to keep the proxy dependency free.
 */
function negotiate(request: NextRequest): string {
  const cookie = request.cookies.get(LOCALE_COOKIE)?.value;
  if (isLocale(cookie)) {
    return cookie;
  }

  const header = request.headers.get("accept-language") ?? "";
  const candidates = header
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const quality = params.find((param) => param.trim().startsWith("q="));
      return {
        tag: tag.trim().toLowerCase(),
        q: quality ? Number.parseFloat(quality.split("=")[1]) || 0 : 1,
      };
    })
    .sort((a, b) => b.q - a.q);

  for (const { tag } of candidates) {
    if (tag === "ne" || tag.startsWith("ne-")) {
      return "ne";
    }
    if (tag === "en" || tag.startsWith("en-")) {
      return "en";
    }
  }
  return DEFAULT_LOCALE;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const firstSegment = pathname.split("/")[1];
  const hasLocalePrefix = isLocale(firstSegment);
  const locale = hasLocalePrefix ? firstSegment : undefined;
  const pathWithoutLocale = hasLocalePrefix ? pathname.slice(`/${locale}`.length) || "/" : pathname;

  if (/^\/admin(\/|$)/.test(pathWithoutLocale)) {
    if (!request.cookies.has(SESSION_COOKIE)) {
      const resolved = locale ?? negotiate(request);
      const signInUrl = request.nextUrl.clone();
      signInUrl.pathname = `/${resolved}/sign-in`;
      signInUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(signInUrl);
    }
  }

  if (hasLocalePrefix) {
    return NextResponse.next();
  }

  const negotiated = negotiate(request);
  const target = request.nextUrl.clone();
  target.pathname = `/${negotiated}${pathname === "/" ? "" : pathname}`;
  const response = NextResponse.redirect(target);
  if (!request.cookies.has(LOCALE_COOKIE)) {
    response.cookies.set(LOCALE_COOKIE, negotiated, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
  }
  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\..*).*)"],
};
