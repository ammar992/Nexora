import { listListings, type ListQuery } from "@/server/services/dashboard";
import { PageHeader } from "@/components/organisms/dashboard/PageHeader";
import { ListingsTable } from "@/components/organisms/commerce/ListingsTable";

export const metadata = { title: "Listings" };

export default async function AdminListings({ searchParams }: { searchParams: Promise<ListQuery> }) {
  const data = await listListings({}, await searchParams);
  return (
    <>
      <PageHeader title="Listings" description="Approve new listings, feature the best ones, and edit or remove anything that breaks the rules." />
      <ListingsTable data={data as never} audience="admin" />
    </>
  );
}
