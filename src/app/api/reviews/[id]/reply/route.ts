import * as yup from "yup";
import { route, parseBody, ok, ApiError, assertObjectId } from "@/server/http";
import { requireVendor } from "@/server/auth/session";
import { Review } from "@/server/models/Review";
import { notify } from "@/server/services/notifications";

export const POST = route<{ id: string }>(async (req, { params }) => {
  const user = await requireVendor();
  const { id } = await params;
  assertObjectId(id, "review");
  const { text } = await parseBody(req, yup.object({ text: yup.string().trim().min(2, "Write a reply").max(1000).required("Write a reply") }));
  const review = await Review.findOne({ _id: id, vendor: user.vendorId }).populate("listing", "slug title");
  if (!review) throw new ApiError(404, "Review not found.");
  review.vendorReply = { text, at: new Date() };
  await review.save();
  const listing = review.listing as unknown as { slug: string; title: string };
  await notify(review.author, { type: "review", title: `The vendor replied to your review of ${listing.title}`, link: `/listing/${listing.slug}#reviews` });
  return ok({ replied: true });
});
