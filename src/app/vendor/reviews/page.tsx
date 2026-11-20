import { requirePageUser } from "@/server/auth/session";
import { listReviews, type ListQuery } from "@/server/services/dashboard";
import { PageHeader } from "@/components/organisms/dashboard/PageHeader";
import { ReviewsManager } from "@/components/organisms/commerce/ReviewsManager";
import { VendorProfile } from "@/server/models/VendorProfile";

export const metadata = { title: "Reviews" };

export default async function VendorReviews({ searchParams }: { searchParams: Promise<ListQuery> }) {
  const user = await requirePageUser();
  const [data, vendor] = await Promise.all([listReviews({ vendor: user.vendorId! }, await searchParams), VendorProfile.findById(user.vendorId).select("rating reviewCount").lean()]);
  return (
    <>
      <PageHeader title="Reviews" description={vendor?.reviewCount ? `${vendor.rating.toFixed(1)} average across ${vendor.reviewCount} verified reviews. Replies are public.` : "Verified reviews from your customers will appear here."} />
      <ReviewsManager data={data as never} audience="vendor" />
    </>
  );
}
