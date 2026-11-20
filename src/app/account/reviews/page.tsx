import { requirePageUser } from "@/server/auth/session";
import { listReviews, type ListQuery } from "@/server/services/dashboard";
import { PageHeader } from "@/components/organisms/dashboard/PageHeader";
import { ReviewsManager } from "@/components/organisms/commerce/ReviewsManager";

export const metadata = { title: "My reviews" };

export default async function MyReviews({ searchParams }: { searchParams: Promise<ListQuery> }) {
  const user = await requirePageUser();
  const data = await listReviews({ author: user.id }, await searchParams);
  return (
    <>
      <PageHeader title="My reviews" description="Reviews you've written for things you bought or booked." />
      <ReviewsManager data={data as never} audience="customer" />
    </>
  );
}
