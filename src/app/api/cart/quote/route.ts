import * as yup from "yup";
import mongoose from "mongoose";
import { route, parseBody, ok } from "@/server/http";
import { Listing } from "@/server/models/Listing";

/** Returns live price / stock for cart lines so the cart never shows stale data. */
export const POST = route(async (req) => {
  const { ids } = await parseBody(req, yup.object({ ids: yup.array(yup.string().required()).max(50).required() }));
  const valid = ids.filter((id) => mongoose.isValidObjectId(id));
  const listings = await Listing.find({ _id: { $in: valid } })
    .select("title slug price compareAtPrice stock status type images shippingFee vendor currency")
    .populate("vendor", "storeName slug status")
    .lean();
  const items = listings.map((l) => {
    const vendor = l.vendor as unknown as { storeName: string; slug: string; status: string } | null;
    return {
      listingId: l._id.toString(),
      title: l.title,
      slug: l.slug,
      price: l.price,
      compareAtPrice: l.compareAtPrice,
      stock: l.stock ?? 0,
      shippingFee: l.shippingFee ?? 0,
      image: l.images?.[0]?.url ?? "",
      vendorId: (l.vendor as unknown as { _id: mongoose.Types.ObjectId })?._id?.toString() ?? "",
      vendorName: vendor?.storeName ?? "",
      available: l.status === "approved" && l.type === "product" && vendor?.status === "approved",
      currency: l.currency ?? "USD",
    };
  });
  return ok({ items });
});
