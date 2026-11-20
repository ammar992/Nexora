import { route, parseBody, ok } from "@/server/http";
import { listingSchema } from "@/formik/schema/listing";
import { requireVendor } from "@/server/auth/session";
import { createListing } from "@/server/services/listings";

export const POST = route(async (req) => {
  const user = await requireVendor();
  const input = await parseBody(req, listingSchema);
  const listing = await createListing(user, input);
  return ok({ id: listing._id.toString(), slug: listing.slug, status: listing.status }, { status: 201 });
});
