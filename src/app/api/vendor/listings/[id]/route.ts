import { route, parseBody, ok, ApiError } from "@/server/http";
import { listingSchema } from "@/formik/schema/listing";
import { requireUser } from "@/server/auth/session";
import { updateListing, removeListing } from "@/server/services/listings";

async function editor() {
  const user = await requireUser(["vendor", "admin"]);
  if (user.role !== "admin" && user.vendorStatus !== "approved") throw new ApiError(403, "Your vendor account is not approved.");
  return user;
}

/** Full update (used by both the vendor editor and admin "edit listing"). */
export const PUT = route<{ id: string }>(async (req, { params }) => {
  const user = await editor();
  const { id } = await params;
  const input = await parseBody(req, listingSchema);
  const listing = await updateListing(user, id, input);
  return ok({ id: listing._id.toString(), slug: listing.slug, status: listing.status });
});

export const DELETE = route<{ id: string }>(async (_req, { params }) => {
  const user = await editor();
  const { id } = await params;
  return ok(await removeListing(user, id));
});
