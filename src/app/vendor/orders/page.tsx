import { requirePageUser } from "@/server/auth/session";
import { listOrders, type ListQuery } from "@/server/services/dashboard";
import { PageHeader } from "@/components/organisms/dashboard/PageHeader";
import { OrdersView } from "@/components/organisms/commerce/OrdersView";

export const metadata = { title: "Orders" };

export default async function VendorOrders({ searchParams }: { searchParams: Promise<ListQuery> }) {
  const user = await requirePageUser();
  const data = await listOrders({ vendor: user.vendorId! }, await searchParams);
  return (
    <>
      <PageHeader title="Orders" description="Open an order to update its status, add tracking or record a cash payment. Totals show your earnings after commission." />
      <OrdersView data={data as never} audience="vendor" />
    </>
  );
}
