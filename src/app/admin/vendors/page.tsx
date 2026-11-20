import { listVendorsAdmin, type ListQuery } from "@/server/services/dashboard";
import { PageHeader } from "@/components/organisms/dashboard/PageHeader";
import { VendorsTable } from "@/components/templates/Admin/VendorsTable";

export const metadata = { title: "Vendors" };

export default async function AdminVendors({ searchParams }: { searchParams: Promise<ListQuery> }) {
  const data = await listVendorsAdmin(await searchParams);
  return (
    <>
      <PageHeader title="Vendors" description="Review applications, feature great stores, and monitor performance." />
      <VendorsTable data={data as never} />
    </>
  );
}
