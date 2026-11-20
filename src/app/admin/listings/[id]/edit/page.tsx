import { notFound } from "next/navigation";
import mongoose from "mongoose";
import { PageHeader } from "@/components/organisms/dashboard/PageHeader";
import { ListingForm } from "@/components/templates/Vendor/ListingForm";
import { StatusBadge } from "@/components/atoms/Badge";
import { activeCategoryOptions, listingFormValues } from "@/server/services/listingForm";

export const metadata = { title: "Edit listing" };

export default async function AdminEditListing({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) notFound();
  const [categories, listing] = await Promise.all([activeCategoryOptions(), listingFormValues(id)]);
  if (!listing) notFound();
  return (
    <>
      <PageHeader title="Edit listing" description={<span className="inline-flex items-center gap-2">Admin edit, status stays as is: <StatusBadge status={listing.status} /></span>} back={{ href: "/admin/listings", label: "Listings" }} />
      <ListingForm categories={categories} initial={listing.values as never} listingId={id} backHref="/admin/listings" />
    </>
  );
}
