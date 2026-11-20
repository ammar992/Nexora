import { listReviews, type ListQuery } from "@/server/services/dashboard";
import { PageHeader } from "@/components/organisms/dashboard/PageHeader";
import { ReviewsManager } from "@/components/organisms/commerce/ReviewsManager";

export const metadata = { title: "Reviews" };

export default async function AdminReviews({ searchParams }: { searchParams: Promise<ListQuery> }) {
  const data = await listReviews({}, await searchParams);
  return (
    <>
      <PageHeader title="Reviews" description="Hide abusive or off-topic reviews. Ratings recalculate automatically." />
      <ReviewsManager data={data as never} audience="admin" />
    </>
  );
}
