import * as yup from "yup";
import { route, parseBody, ok, ApiError, assertObjectId } from "@/server/http";
import { requireVendor } from "@/server/auth/session";
import { Listing } from "@/server/models/Listing";

/** Quick inline edits from the listings table (price / stock / pause) without re-review. */
export const PATCH = route<{ id: string }>(async (req, { params }) => {
  const user = await requireVendor();
  const { id } = await params;
  assertObjectId(id, "listing");
  const body = await parseBody(
    req,
    yup.object({
      price: yup.number().min(0).max(1_000_000).optional(),
      stock: yup.number().integer().min(0).max(1_000_000).optional(),
      paused: yup.boolean().optional(),
    })
  );
  const listing = await Listing.findOne({ _id: id, vendor: user.vendorId });
  if (!listing) throw new ApiError(404, "Listing not found.");
  if (body.price !== undefined) listing.price = body.price;
  if (body.stock !== undefined && listing.type === "product") listing.stock = body.stock;
  if (body.paused === true && listing.status === "approved") listing.status = "draft";
  if (body.paused === false && listing.status === "draft") listing.status = "pending";
  await listing.save();
  return ok({ price: listing.price, stock: listing.stock, status: listing.status });
});
