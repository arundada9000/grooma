import { NextResponse, type NextRequest } from "next/server";

/**
 * Edge-safe gate for /admin: cookie presence only. The real authorization
 * (valid session, OWNER role, shop scoping) runs server-side via
 * requireUser/requireOwner on every admin page and action.
 */
const SESSION_COOKIE = "better-auth.session_token";

export function proxy(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    const signInUrl = new URL("/sign-in", request.url);
    signInUrl.searchParams.set("next", new URL(request.url).pathname);
    return NextResponse.redirect(signInUrl);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
