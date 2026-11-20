import { Plus } from "lucide-react";
import { requirePageUser } from "@/server/auth/session";
import { listListings, type ListQuery } from "@/server/services/dashboard";
import { PageHeader } from "@/components/organisms/dashboard/PageHeader";
import { ListingsTable } from "@/components/organisms/commerce/ListingsTable";
import { ButtonLink } from "@/components/atoms/Button";

export const metadata = { title: "Listings" };

export default async function VendorListings({ searchParams }: { searchParams: Promise<ListQuery> }) {
  const user = await requirePageUser();
  const data = await listListings({ vendor: user.vendorId! }, await searchParams);
  return (
    <>
      <PageHeader title="Listings" description="Products and services in your store. Edit stock right in the table." actions={<ButtonLink href="/vendor/listings/new"><Plus className="size-4" /> New listing</ButtonLink>} />
      <ListingsTable data={data as never} audience="vendor" />
    </>
  );
}
