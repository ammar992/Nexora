import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connectDB } from "@/server/db";
import { User, type Role } from "@/server/models/User";
import { VendorProfile } from "@/server/models/VendorProfile";
import { SESSION_COOKIE, SESSION_MAX_AGE_SECONDS } from "@/resources/utils/constant";
import { isProd } from "@/server/env";
import { signSession, verifySessionToken } from "./jwt";
import { ApiError } from "@/server/http";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar: string;
  emailVerified: boolean;
  vendorId: string | null;
  vendorStatus: string | null;
};

export async function createSession(user: { _id: { toString(): string }; role: Role; tokenVersion?: number }) {
  const token = await signSession({ sub: user._id.toString(), role: user.role, v: user.tokenVersion ?? 0 });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function destroySession() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

/**
 * Authoritative session lookup: verifies the JWT, then loads the user to make sure the
 * account still exists, is active, and the token version has not been revoked.
 * Cached per request.
 */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const jar = await cookies();
  const payload = await verifySessionToken(jar.get(SESSION_COOKIE)?.value);
  if (!payload) return null;
  await connectDB();
  const user = await User.findById(payload.sub).lean();
  if (!user || !user.isActive || (user.tokenVersion ?? 0) !== payload.v) return null;
  const vendor = user.role !== "customer" ? await VendorProfile.findOne({ user: user._id }).select("_id status").lean() : null;
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role as Role,
    avatar: user.avatar ?? "",
    emailVerified: !!user.emailVerified,
    vendorId: vendor?._id.toString() ?? null,
    vendorStatus: vendor?.status ?? null,
  };
});

/** For API routes: throws 401/403 ApiErrors. */
export async function requireUser(roles?: Role[]) {
  const user = await getCurrentUser();
  if (!user) throw new ApiError(401, "Please sign in to continue.");
  if (roles && !roles.includes(user.role)) throw new ApiError(403, "You don't have permission to do that.");
  return user;
}

/** For API routes used by vendors: requires an approved vendor profile. */
export async function requireVendor() {
  const user = await requireUser(["vendor", "admin"]);
  if (!user.vendorId || user.vendorStatus !== "approved") {
    throw new ApiError(403, "Your vendor account is not approved yet.");
  }
  return user as SessionUser & { vendorId: string };
}

/** For server components / layouts: redirects instead of throwing. */
export async function requirePageUser(roles?: Role[], next = "/") {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  if (roles && !roles.includes(user.role)) redirect("/");
  return user;
}
