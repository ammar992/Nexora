import { requirePageUser } from "@/server/auth/session";
import { listVendorCustomers, type ListQuery } from "@/server/services/dashboard";
import { PageHeader } from "@/components/organisms/dashboard/PageHeader";
import { CustomersTable } from "@/components/organisms/commerce/CustomersTable";

export const metadata = { title: "Customers" };

export default async function VendorCustomers({ searchParams }: { searchParams: Promise<ListQuery> }) {
  const user = await requirePageUser();
  const data = await listVendorCustomers(user.vendorId!, await searchParams);
  return (
    <>
      <PageHeader title="Customers" description="Everyone who has ordered or booked with you." />
      <CustomersTable data={data} />
    </>
  );
}
