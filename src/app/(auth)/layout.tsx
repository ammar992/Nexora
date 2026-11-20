import { AuthShell } from "@/components/templates/Auth/AuthShell";
import { getPublicSettings } from "@/server/services/settings";
import { Listing } from "@/server/models/Listing";
import { connectDB } from "@/server/db";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const settings = await getPublicSettings();
  await connectDB();
  const picks = await Listing.find({ status: "approved", "images.0": { $exists: true } }).sort({ rating: -1 }).limit(3).select("images title").lean();
  return (
    <AuthShell siteName={settings.siteName} logoUrl={settings.logoUrl} images={picks.map((p) => ({ url: p.images[0].url, alt: p.title }))}>
      {children}
    </AuthShell>
  );
}
