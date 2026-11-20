import { listBookings, type ListQuery } from "@/server/services/dashboard";
import { PageHeader } from "@/components/organisms/dashboard/PageHeader";
import { BookingsView } from "@/components/organisms/commerce/BookingsView";

export const metadata = { title: "Bookings" };

export default async function AdminBookings({ searchParams }: { searchParams: Promise<ListQuery & { when?: string }> }) {
  const data = await listBookings({}, await searchParams);
  return (
    <>
      <PageHeader title="Bookings" description="Every booking on the platform. Open one to change its status, cancel it, or refund it." />
      <BookingsView data={data as never} audience="admin" />
    </>
  );
}
