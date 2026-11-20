import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/organisms/dashboard/DashboardShell";
import { requirePageUser } from "@/server/auth/session";
import { getSettings } from "@/server/services/settings";
import { Order } from "@/server/models/Order";
import { Booking } from "@/server/models/Booking";

export default async function VendorLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePageUser(["vendor", "admin"], "/vendor");
  if (!user.vendorId || user.vendorStatus !== "approved") redirect(user.role === "admin" ? "/admin" : "/become-vendor");
  const [settings, newOrders, pendingBookings] = await Promise.all([
    getSettings(),
    Order.countDocuments({ vendor: user.vendorId, status: "processing" }),
    Booking.countDocuments({ vendor: user.vendorId, status: "pending" }),
  ]);
  return (
    <DashboardShell area="vendor" siteName={settings.siteName} badges={{ "/vendor/orders": newOrders, "/vendor/bookings": pendingBookings }}>
      {children}
    </DashboardShell>
  );
}
