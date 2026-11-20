import "server-only";

export function appUrl() {
  return (process.env.NEXTAUTH_URL || "http://localhost:3000").replace(/\/$/, "");
}

export function requireEmailVerification() {
  return (process.env.REQUIRE_EMAIL_VERIFICATION ?? "true").toLowerCase() !== "false";
}

export const isProd = process.env.NODE_ENV === "production";
