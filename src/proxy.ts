import { NextResponse, type NextRequest } from "next/server";
import { verifySession } from "@/lib/auth/session";
import { SESSION_COOKIE } from "@/lib/constants";

/**
 * Optimistic authentication check. Redirects anonymous visitors away from
 * admin routes before rendering. Real authorization happens in layouts,
 * pages, and server actions via requireUser()/requireAdmin(), which also
 * confirm the account is still active.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = await verifySession(request.cookies.get(SESSION_COOKIE)?.value);

  if (pathname === "/login") {
    if (session) return NextResponse.redirect(new URL("/dashboard", request.url));
    return NextResponse.next();
  }

  if (!session) {
    const loginUrl = new URL("/login", request.url);
    if (pathname !== "/") loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const adminOnly =
    pathname.startsWith("/users") || pathname.startsWith("/settings") || /^\/donations\/[^/]+\/edit/.test(pathname);
  if (adminOnly && session.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard?error=forbidden", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Protect everything except:
     * - /receipt/* (public receipt pages by secure token)
     * - /api/receipts/* (public receipt PDF by secure token)
     * - Next.js internals and static assets
     */
    "/((?!receipt/|api/receipts/|_next/|favicon.ico|logo|fonts/|robots.txt|manifest|.*\\.(?:png|jpg|jpeg|svg|ico|webp|css|js|woff2?)$).*)",
  ],
};
