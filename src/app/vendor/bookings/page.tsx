import { requirePageUser } from "@/server/auth/session";
import { listBookings, type ListQuery } from "@/server/services/dashboard";
import { PageHeader } from "@/components/organisms/dashboard/PageHeader";
import { BookingsView } from "@/components/organisms/commerce/BookingsView";

export const metadata = { title: "Bookings" };

export default async function VendorBookings({ searchParams }: { searchParams: Promise<ListQuery & { when?: string }> }) {
  const user = await requirePageUser();
  const data = await listBookings({ vendor: user.vendorId! }, await searchParams);
  return (
    <>
      <PageHeader title="Bookings" description="Confirm requests, mark sessions complete, and keep your calendar tidy. Totals show your earnings after commission." />
      <BookingsView data={data as never} audience="vendor" />
    </>
  );
}
