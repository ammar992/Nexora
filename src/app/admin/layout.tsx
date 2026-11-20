import { DashboardShell } from "@/components/organisms/dashboard/DashboardShell";
import { requirePageUser } from "@/server/auth/session";
import { getSettings } from "@/server/services/settings";
import { VendorProfile } from "@/server/models/VendorProfile";
import { Listing } from "@/server/models/Listing";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requirePageUser(["admin"], "/admin");
  const [settings, pendingVendors, pendingListings] = await Promise.all([
    getSettings(),
    VendorProfile.countDocuments({ status: "pending" }),
    Listing.countDocuments({ status: "pending" }),
  ]);
  return (
    <DashboardShell area="admin" siteName={settings.siteName} badges={{ "/admin/vendors": pendingVendors, "/admin/listings": pendingListings }}>
      {children}
    </DashboardShell>
  );
}
