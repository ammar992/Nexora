import "server-only";
import crypto from "node:crypto";
import type { Types } from "mongoose";
import { AuthToken } from "@/server/models/AuthToken";

type Purpose = "verify_email" | "reset_password";

const TTL_MS: Record<Purpose, number> = {
  verify_email: 1000 * 60 * 60 * 24, // 24h
  reset_password: 1000 * 60 * 30, // 30 min
};

const hash = (token: string) => crypto.createHash("sha256").update(token).digest("hex");

/** Creates a fresh single-use token (invalidating older unused ones for the same purpose). */
export async function issueToken(userId: Types.ObjectId | string, purpose: Purpose) {
  await AuthToken.deleteMany({ user: userId, purpose, usedAt: { $exists: false } });
  const token = crypto.randomBytes(32).toString("base64url");
  await AuthToken.create({ user: userId, purpose, tokenHash: hash(token), expiresAt: new Date(Date.now() + TTL_MS[purpose]) });
  return token;
}

/** Atomically consumes a token. Returns the user id or null if invalid/expired/used. */
export async function consumeToken(token: string, purpose: Purpose) {
  if (!token || token.length < 20) return null;
  const doc = await AuthToken.findOneAndUpdate(
    { tokenHash: hash(token), purpose, usedAt: { $exists: false }, expiresAt: { $gt: new Date() } },
    { $set: { usedAt: new Date() } },
    { returnDocument: "after" }
  ).lean();
  return doc?.user ?? null;
}
