import "server-only";
import type { NextRequest } from "next/server";
import { RateLimit } from "@/server/models/RateLimit";
import { ApiError } from "@/server/http";

export function clientIp(req: NextRequest) {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

/**
 * Fixed-window rate limiter backed by MongoDB so limits hold across server instances.
 * Throws 429 when the bucket is exhausted.
 */
export async function rateLimit(bucket: string, identifier: string, limit: number, windowSeconds: number) {
  const windowStart = Math.floor(Date.now() / (windowSeconds * 1000));
  const key = `${bucket}:${identifier}:${windowStart}`;
  const expiresAt = new Date((windowStart + 1) * windowSeconds * 1000);
  const doc = await RateLimit.findOneAndUpdate(
    { key },
    { $inc: { count: 1 }, $setOnInsert: { expiresAt } },
    { upsert: true, returnDocument: "after" }
  ).lean();
  if (doc && doc.count > limit) {
    const retry = Math.max(1, Math.ceil((expiresAt.getTime() - Date.now()) / 1000));
    throw new ApiError(429, `Too many attempts. Please wait ${retry < 90 ? `${retry} seconds` : `${Math.ceil(retry / 60)} minutes`} and try again.`);
  }
}
