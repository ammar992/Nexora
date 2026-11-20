import { PageHeader } from "@/components/organisms/dashboard/PageHeader";
import { ListingForm } from "@/components/templates/Vendor/ListingForm";
import { EMPTY_LISTING } from "@/resources/utils/listingDefaults";
import { activeCategoryOptions } from "@/server/services/listingForm";
import { requirePageUser } from "@/server/auth/session";
import { VendorProfile } from "@/server/models/VendorProfile";

export const metadata = { title: "New listing" };

export default async function NewListing() {
  const user = await requirePageUser();
  const [categories, vendor] = await Promise.all([activeCategoryOptions(), VendorProfile.findById(user.vendorId).select("location").lean()]);
  const initial = { ...EMPTY_LISTING, location: { city: vendor?.location?.city ?? "", country: vendor?.location?.country ?? "", remote: false } };
  return (
    <>
      <PageHeader title="New listing" description="Add a product to ship or a service to book." back={{ href: "/vendor/listings", label: "Listings" }} />
      <ListingForm categories={categories} initial={initial} backHref="/vendor/listings" />
    </>
  );
}
