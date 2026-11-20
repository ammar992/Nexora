import "server-only";
import { cache } from "react";
import { connectDB } from "@/server/db";
import { PlatformSettings, type PlatformSettingsDoc } from "@/server/models/PlatformSettings";

/** Loads (or lazily creates) the singleton settings document. Cached per request. */
export const getSettings = cache(async (): Promise<PlatformSettingsDoc> => {
  await connectDB();
  const doc = await PlatformSettings.findOneAndUpdate(
    { key: "global" },
    { $setOnInsert: { key: "global" } },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
  ).lean();
  return doc as PlatformSettingsDoc;
});

/** The subset of settings that is safe to send to the browser. */
export async function getPublicSettings() {
  const s = await getSettings();
  return {
    siteName: s.siteName,
    tagline: s.tagline,
    logoUrl: s.logoUrl,
    faviconUrl: s.faviconUrl,
    currency: s.currency,
    homepage: s.homepage,
    contact: s.contact,
    social: s.social,
  };
}
export type PublicSettings = Awaited<ReturnType<typeof getPublicSettings>>;
