import { route, parseBody, ok, ApiError, assertObjectId } from "@/server/http";
import { listingModerationSchema } from "@/formik/schema/admin";
import { requireUser } from "@/server/auth/session";
import { Listing } from "@/server/models/Listing";
import { VendorProfile } from "@/server/models/VendorProfile";
import { notify } from "@/server/services/notifications";
import { removeListing } from "@/server/services/listings";

/** Approve / reject / archive / feature a listing. */
export const PATCH = route<{ id: string }>(async (req, { params }) => {
  await requireUser(["admin"]);
  const { id } = await params;
  assertObjectId(id, "listing");
  const body = await parseBody(req, listingModerationSchema);
  const listing = await Listing.findById(id);
  if (!listing) throw new ApiError(404, "Listing not found.");
  const previous = listing.status;
  // Apply the status first so "approve + feature" works in a single request.
  if (body.status) {
    if (body.status === "approved") {
      const vendor = await VendorProfile.findById(listing.vendor).select("status").lean();
      if (vendor?.status !== "approved") throw new ApiError(409, "Approve the vendor before approving their listings.");
    }
    listing.status = body.status as typeof listing.status;
    listing.rejectionReason = body.status === "rejected" ? body.reason : "";
    if (body.status !== "approved") listing.featured = false;
  }
  if (body.featured !== undefined) {
    if (body.featured && listing.status !== "approved") throw new ApiError(409, "Only approved listings can be featured.");
    listing.featured = body.featured;
  }
  await listing.save();
  if (body.status && body.status !== previous && (body.status === "approved" || body.status === "rejected")) {
    await notify(listing.owner, {
      type: "listing",
      title: body.status === "approved" ? `“${listing.title}” is live` : `“${listing.title}” needs changes`,
      body: body.reason || (body.status === "approved" ? "Customers can now find it on the marketplace." : ""),
      link: body.status === "approved" ? `/listing/${listing.slug}` : `/vendor/listings/${listing._id}/edit`,
    });
  }
  return ok({ status: listing.status, featured: listing.featured });
});

export const DELETE = route<{ id: string }>(async (_req, { params }) => {
  const admin = await requireUser(["admin"]);
  const { id } = await params;
  return ok(await removeListing(admin, id));
});
