import { route, parseBody, ok, ApiError, assertObjectId } from "@/server/http";
import { reviewSchema } from "@/formik/schema/listing";
import { requireUser } from "@/server/auth/session";
import { Listing } from "@/server/models/Listing";
import { Review } from "@/server/models/Review";
import { VendorProfile } from "@/server/models/VendorProfile";
import { hasCompletedPurchase, recomputeRatings } from "@/server/services/reviews";
import { notify } from "@/server/services/notifications";
import { rateLimit } from "@/server/rateLimit";

export const POST = route<{ id: string }>(async (req, { params }) => {
  const user = await requireUser();
  await rateLimit("review", user.id, 10, 60 * 60);
  const { id } = await params;
  assertObjectId(id, "listing");
  const body = await parseBody(req, reviewSchema);
  const listing = await Listing.findById(id).select("vendor owner title slug").lean();
  if (!listing) throw new ApiError(404, "Listing not found.");
  if (listing.owner.toString() === user.id) throw new ApiError(400, "You can't review your own listing.");
  if (!(await hasCompletedPurchase(user.id, id))) {
    throw new ApiError(403, "You can review this once your order is delivered or your booking is completed.");
  }
  const existing = await Review.findOne({ listing: id, author: user.id });
  if (existing) {
    existing.set({ rating: body.rating, title: body.title, comment: body.comment });
    await existing.save();
  } else {
    await Review.create({ listing: id, vendor: listing.vendor, author: user.id, rating: body.rating, title: body.title, comment: body.comment, verified: true });
    const vendor = await VendorProfile.findById(listing.vendor).select("user").lean();
    if (vendor) await notify(vendor.user, { type: "review", title: `New ${body.rating}★ review on ${listing.title}`, body: body.comment.slice(0, 200), link: "/vendor/reviews" });
  }
  await recomputeRatings(listing._id, listing.vendor);
  return ok({ saved: true, updated: Boolean(existing) }, { status: existing ? 200 : 201 });
});
