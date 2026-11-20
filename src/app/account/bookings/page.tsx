import { requirePageUser } from "@/server/auth/session";
import { listBookings, type ListQuery } from "@/server/services/dashboard";
import { PageHeader } from "@/components/organisms/dashboard/PageHeader";
import { BookingsView } from "@/components/organisms/commerce/BookingsView";

export const metadata = { title: "Bookings" };

export default async function AccountBookings({ searchParams }: { searchParams: Promise<ListQuery & { when?: string }> }) {
  const user = await requirePageUser();
  const data = await listBookings({ customer: user.id }, await searchParams);
  return (
    <>
      <PageHeader title="Bookings" description="Your appointments, classes and sessions." />
      <BookingsView data={data as never} audience="customer" />
    </>
  );
}
