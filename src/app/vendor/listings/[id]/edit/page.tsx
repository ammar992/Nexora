import { notFound } from "next/navigation";
import { PageHeader } from "@/components/organisms/dashboard/PageHeader";
import { ListingForm } from "@/components/templates/Vendor/ListingForm";
import { StatusBadge } from "@/components/atoms/Badge";
import { activeCategoryOptions, listingFormValues } from "@/server/services/listingForm";
import { requirePageUser } from "@/server/auth/session";
import mongoose from "mongoose";

export const metadata = { title: "Edit listing" };

export default async function EditListing({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePageUser();
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) notFound();
  const [categories, listing] = await Promise.all([activeCategoryOptions(), listingFormValues(id)]);
  if (!listing || listing.vendorId !== user.vendorId) notFound();
  return (
    <>
      <PageHeader title="Edit listing" description={<span className="inline-flex items-center gap-2">Status: <StatusBadge status={listing.status} /></span>} back={{ href: "/vendor/listings", label: "Listings" }} />
      <ListingForm categories={categories} initial={listing.values as never} listingId={id} backHref="/vendor/listings" currentStatus={listing.status} />
    </>
  );
}
