import { NextResponse, type NextRequest } from "next/server";
import { guardRoute } from "@/lib/route-guard";

// Convenience redirects only (PRD FR-4). It checks that the session cookies EXIST; it cannot verify
// them because the signing secret belongs to the backend. The authoritative check (signature, expiry
// and the database version) runs in the API on every call and in ensureShop() on every server page.
const cookieName = (kind: "shop" | "admin") => `${process.env.NODE_ENV === "production" ? "__Host-" : ""}salon_${kind}`;

export function proxy(request: NextRequest) {
  const decision = guardRoute({
    pathname: request.nextUrl.pathname,
    search: request.nextUrl.search,
    hasShop: Boolean(request.cookies.get(cookieName("shop"))?.value),
    hasAdmin: Boolean(request.cookies.get(cookieName("admin"))?.value),
  });

  if (decision) return NextResponse.redirect(new URL(decision.redirect, request.url));
  return NextResponse.next();
}

export const config = {
  // Skip the API (the backend authorises it), Next internals and static assets, so redirects never
  // block API calls, CSS/JS or images.
  matcher: ["/((?!api/|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
