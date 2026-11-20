import { SignJWT, jwtVerify } from "jose";
import { SESSION_MAX_AGE_SECONDS } from "@/resources/utils/constant";
import type { Role } from "@/server/models/User";

export type SessionPayload = { sub: string; role: Role; v: number };

const ALG = "HS256";

function secret() {
  const s = process.env.NEXTAUTH_SECRET;
  if (!s || s.length < 32) throw new Error("NEXTAUTH_SECRET must be at least 32 characters.");
  return new TextEncoder().encode(s);
}

export async function signSession(payload: SessionPayload) {
  return new SignJWT({ role: payload.role, v: payload.v })
    .setProtectedHeader({ alg: ALG })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .setIssuer("nexora")
    .sign(secret());
}

/** Verifies signature + expiry only. Callers that need authority must also check the DB (see session.ts). */
export async function verifySessionToken(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret(), { issuer: "nexora", algorithms: [ALG] });
    if (!payload.sub) return null;
    return { sub: payload.sub, role: payload.role as Role, v: Number(payload.v ?? 0) };
  } catch {
    return null;
  }
}
