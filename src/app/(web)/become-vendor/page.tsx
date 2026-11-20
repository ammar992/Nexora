import { BecomeVendorTemplate } from "@/components/templates/BecomeVendor";
import { getCurrentUser } from "@/server/auth/session";
import { VendorProfile } from "@/server/models/VendorProfile";
import { getSettings } from "@/server/services/settings";

export const metadata = { title: "Sell on the marketplace" };

export default async function BecomeVendorPage() {
  const [user, settings] = await Promise.all([getCurrentUser(), getSettings()]);
  const profile = user ? await VendorProfile.findOne({ user: user.id }).select("status storeName rejectionReason tagline description location contactEmail contactPhone website").lean() : null;
  return (
    <BecomeVendorTemplate
      signedIn={!!user}
      commission={settings.commissionRate}
      siteName={settings.siteName}
      defaults={{ contactEmail: user?.email ?? "" }}
      existing={
        profile
          ? {
              status: profile.status,
              storeName: profile.storeName,
              rejectionReason: profile.rejectionReason ?? "",
              tagline: profile.tagline ?? "",
              description: profile.description ?? "",
              city: profile.location?.city ?? "",
              country: profile.location?.country ?? "",
              contactEmail: profile.contactEmail ?? "",
              contactPhone: profile.contactPhone ?? "",
              website: profile.website ?? "",
            }
          : null
      }
    />
  );
}
