import type { Types } from "mongoose";
import { Review } from "../src/server/models/Review";
import { Listing } from "../src/server/models/Listing";
import { VendorProfile } from "../src/server/models/VendorProfile";

/** Script-side copy of services/reviews#recomputeRatings (that module is server-only). */
export async function recomputeRatingsStandalone(listingId: Types.ObjectId, vendorId: Types.ObjectId) {
  const [l] = await Review.aggregate<{ avg: number; n: number }>([{ $match: { listing: listingId, isHidden: false } }, { $group: { _id: null, avg: { $avg: "$rating" }, n: { $sum: 1 } } }]);
  await Listing.updateOne({ _id: listingId }, { $set: { rating: l ? Math.round(l.avg * 10) / 10 : 0, reviewCount: l?.n ?? 0 } });
  const [v] = await Review.aggregate<{ avg: number; n: number }>([{ $match: { vendor: vendorId, isHidden: false } }, { $group: { _id: null, avg: { $avg: "$rating" }, n: { $sum: 1 } } }]);
  await VendorProfile.updateOne({ _id: vendorId }, { $set: { rating: v ? Math.round(v.avg * 10) / 10 : 0, reviewCount: v?.n ?? 0 } });
}
