import * as yup from "yup";
import { route, parseBody, ok, ApiError, assertObjectId } from "@/server/http";
import { requireUser } from "@/server/auth/session";
import { Favorite } from "@/server/models/Favorite";
import { Listing } from "@/server/models/Listing";

/** Toggles a listing in the user's saved list. */
export const POST = route(async (req) => {
  const user = await requireUser();
  const { listingId } = await parseBody(req, yup.object({ listingId: yup.string().required() }));
  assertObjectId(listingId, "listing");
  const removed = await Favorite.findOneAndDelete({ user: user.id, listing: listingId });
  if (removed) return ok({ saved: false });
  if (!(await Listing.exists({ _id: listingId, status: "approved" }))) throw new ApiError(404, "That listing isn't available.");
  try {
    await Favorite.create({ user: user.id, listing: listingId });
  } catch (err) {
    // Double-click race: the unique index already holds it.
    if ((err as { code?: number }).code !== 11000) throw err;
  }
  return ok({ saved: true });
});
