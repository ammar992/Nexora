import * as yup from "yup";
import { route, parseBody, ok, ApiError, assertObjectId } from "@/server/http";
import { requireUser } from "@/server/auth/session";
import { Review } from "@/server/models/Review";
import { recomputeRatings } from "@/server/services/reviews";

/** Hide or restore a review (moderation). */
export const PATCH = route<{ id: string }>(async (req, { params }) => {
  await requireUser(["admin"]);
  const { id } = await params;
  assertObjectId(id, "review");
  const { isHidden } = await parseBody(req, yup.object({ isHidden: yup.boolean().required() }));
  const review = await Review.findByIdAndUpdate(id, { $set: { isHidden } }, { returnDocument: "after" }).lean();
  if (!review) throw new ApiError(404, "Review not found.");
  await recomputeRatings(review.listing, review.vendor);
  return ok({ isHidden });
});
