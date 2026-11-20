import { listOrders, type ListQuery } from "@/server/services/dashboard";
import { PageHeader } from "@/components/organisms/dashboard/PageHeader";
import { OrdersView } from "@/components/organisms/commerce/OrdersView";

export const metadata = { title: "Orders" };

export default async function AdminOrders({ searchParams }: { searchParams: Promise<ListQuery> }) {
  const data = await listOrders({}, await searchParams);
  return (
    <>
      <PageHeader title="Orders" description="Every order on the platform. Open one to update its status, cancel it, or issue a refund." />
      <OrdersView data={data as never} audience="admin" />
    </>
  );
}
