import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifySessionToken, isAuthEnabled } from "@/lib/auth";

export async function middleware(req: NextRequest) {
  if (!isAuthEnabled()) return NextResponse.next();

  const ok = await verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value);
  if (ok) return NextResponse.next();

  const { pathname, search } = req.nextUrl;
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const loginUrl = new URL("/login", req.url);
  const next = pathname + search;
  if (next && next !== "/") loginUrl.searchParams.set("next", next);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  // Everything except Next internals, the login page, and the login
  // endpoint itself. /api/uploads (the images themselves) is included.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|login|api/auth/login).*)"],
};
