import { NextResponse, type NextRequest } from "next/server";
import { verifySessionToken } from "@/server/auth/jwt";
import { SESSION_COOKIE } from "@/resources/utils/constant";

/**
 * Fast first gate for protected areas, based on the signed session cookie.
 * Layouts and API routes still do the authoritative check against the database
 * (deactivated accounts, revoked sessions, vendor approval).
 */
const RULES: { prefix: string; roles?: string[] }[] = [
  { prefix: "/admin", roles: ["admin"] },
  // Vendor role can change while a session is live (approval), so the vendor layout checks it against the DB.
  { prefix: "/vendor" },
  { prefix: "/account" },
  { prefix: "/checkout" },
];

export async function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const rule = RULES.find((r) => pathname === r.prefix || pathname.startsWith(`${r.prefix}/`));
  if (!rule) return NextResponse.next();

  const session = await verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value);
  if (!session) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }
  if (rule.roles && !rule.roles.includes(session.role)) {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/vendor/:path*", "/account/:path*", "/checkout/:path*"],
};
