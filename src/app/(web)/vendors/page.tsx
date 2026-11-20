import { listVendors } from "@/server/services/catalog";
import { VendorsTemplate } from "@/components/templates/Vendors";

export const metadata = { title: "Vendors", description: "Independent makers and service professionals on the marketplace." };

export default async function VendorsPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  const params = await searchParams;
  const result = await listVendors(params);
  return <VendorsTemplate {...result} q={params.q ?? ""} />;
}
