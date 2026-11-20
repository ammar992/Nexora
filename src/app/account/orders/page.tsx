import { requirePageUser } from "@/server/auth/session";
import { listOrders, type ListQuery } from "@/server/services/dashboard";
import { PageHeader } from "@/components/organisms/dashboard/PageHeader";
import { OrdersView } from "@/components/organisms/commerce/OrdersView";

export const metadata = { title: "Orders" };

export default async function AccountOrders({ searchParams }: { searchParams: Promise<ListQuery> }) {
  const user = await requirePageUser();
  const data = await listOrders({ customer: user.id }, await searchParams);
  return (
    <>
      <PageHeader title="Orders" description="Track deliveries, cancel before shipping, and review once it arrives." />
      <OrdersView data={data as never} audience="customer" />
    </>
  );
}
