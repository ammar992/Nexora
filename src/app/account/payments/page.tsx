import { requirePageUser } from "@/server/auth/session";
import { listPayments, type ListQuery } from "@/server/services/dashboard";
import { PageHeader } from "@/components/organisms/dashboard/PageHeader";
import { PaymentsTable } from "@/components/organisms/commerce/PaymentsTable";

export const metadata = { title: "Payments" };

export default async function PaymentsPage({ searchParams }: { searchParams: Promise<ListQuery> }) {
  const user = await requirePageUser();
  const data = await listPayments({ customer: user.id }, await searchParams);
  return (
    <>
      <PageHeader title="Payments" description="Every payment for your orders and bookings. Card details are never stored on our servers." />
      <PaymentsTable data={data as never} />
    </>
  );
}
