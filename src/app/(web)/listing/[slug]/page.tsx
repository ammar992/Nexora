import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ListingTemplate } from "@/components/templates/Listing";
import { getListingDetail, getListingReviews, getRelatedListings, getFavoriteIds } from "@/server/services/catalog";
import { getCurrentUser } from "@/server/auth/session";
import { availableProviders } from "@/server/payments";
import { hasCompletedPurchase } from "@/server/services/reviews";
import { rulesFor } from "@/server/services/availability";
import { Listing } from "@/server/models/Listing";
import { Review } from "@/server/models/Review";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const l = await getListingDetail(slug);
  if (!l) return { title: "Not found" };
  return { title: l.title, description: l.summary || l.description.slice(0, 160), openGraph: { images: l.images?.[0]?.url ? [l.images[0].url] : [] } };
}

export default async function ListingPage({ params }: Params) {
  const { slug } = await params;
  const [listing, user] = await Promise.all([getListingDetail(slug), getCurrentUser()]);
  if (!listing) notFound();

  const vendor = listing.vendor as unknown as { _id: string; user: string; storeName: string; slug: string; logo?: string; tagline?: string; description?: string; location?: { city?: string; country?: string }; rating?: number; reviewCount?: number; createdAt: string; status: string };
  const isOwner = !!user && (user.vendorId === vendor?._id || user.role === "admin");
  if (listing.status !== "approved" && !isOwner) notFound();

  if (listing.status === "approved" && !isOwner) await Listing.updateOne({ _id: listing._id }, { $inc: { views: 1 } });

  const [{ reviews, breakdown }, related, saved, purchased, mine] = await Promise.all([
    getListingReviews(listing._id),
    getRelatedListings({ _id: listing._id, category: listing.category as unknown as { _id: string }, type: listing.type }),
    getFavoriteIds(user?.id),
    user ? hasCompletedPurchase(user.id, listing._id) : Promise.resolve(false),
    user ? Review.findOne({ listing: listing._id, author: user.id }).select("rating title comment").lean() : Promise.resolve(null),
  ]);

  let blocked: string | undefined;
  if (listing.status !== "approved") blocked = `This listing is ${listing.status} and not visible to customers yet.`;
  else if (vendor?.status !== "approved") blocked = "This vendor isn't taking orders right now.";
  else if (user && user.vendorId === vendor._id) blocked = "This is your listing. Customers will see the checkout here.";

  const reviewReason = !user ? "Sign in after your purchase to leave a review." : !purchased ? "You can review this once your order is delivered or your booking is completed." : undefined;

  return (
    <ListingTemplate
      listing={listing}
      vendor={vendor}
      rules={rulesFor(listing as never)}
      providers={availableProviders()}
      reviews={reviews}
      breakdown={breakdown}
      related={related}
      saved={saved.includes(listing._id)}
      savedIds={saved}
      blocked={blocked}
      canReview={purchased}
      existingReview={mine ? { rating: mine.rating, title: mine.title ?? "", comment: mine.comment } : null}
      reviewReason={reviewReason}
    />
  );
}
