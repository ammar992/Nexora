import { requirePageUser } from "@/server/auth/session";
import { VendorProfile } from "@/server/models/VendorProfile";
import { PageHeader } from "@/components/organisms/dashboard/PageHeader";
import { StoreSettingsForm } from "@/components/templates/Vendor/StoreSettingsForm";

export const metadata = { title: "Store settings" };

export default async function VendorSettings() {
  const user = await requirePageUser();
  const v = await VendorProfile.findById(user.vendorId).lean();
  if (!v) return null;
  return (
    <>
      <PageHeader title="Store settings" description="How your storefront looks and how customers reach you." />
      <StoreSettingsForm
        slug={v.slug}
        initial={{
          storeName: v.storeName, tagline: v.tagline ?? "", description: v.description ?? "", city: v.location?.city ?? "", country: v.location?.country ?? "",
          contactEmail: v.contactEmail ?? "", contactPhone: v.contactPhone ?? "", website: v.website ?? "", logo: v.logo ?? "", coverImage: v.coverImage ?? "",
          payoutAccountName: v.payoutDetails?.accountName ?? "", payoutBankName: v.payoutDetails?.bankName ?? "", payoutAccountLast4: v.payoutDetails?.accountNumberLast4 ?? "",
        }}
      />
    </>
  );
}
