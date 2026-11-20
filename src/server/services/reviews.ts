import "server-only";
import mongoose, { type Types } from "mongoose";
import { Review } from "@/server/models/Review";
import { Listing } from "@/server/models/Listing";
import { VendorProfile } from "@/server/models/VendorProfile";
import { Order } from "@/server/models/Order";
import { Booking } from "@/server/models/Booking";

type Id = Types.ObjectId | string;

/** Recomputes the denormalised rating fields on a listing and its vendor. */
export async function recomputeRatings(listingId: Id, vendorId: Id) {
  const [l] = await Review.aggregate<{ avg: number; n: number }>([
    { $match: { listing: new mongoose.Types.ObjectId(listingId.toString()), isHidden: false } },
    { $group: { _id: null, avg: { $avg: "$rating" }, n: { $sum: 1 } } },
  ]);
  await Listing.updateOne({ _id: listingId }, { $set: { rating: l ? Math.round(l.avg * 10) / 10 : 0, reviewCount: l?.n ?? 0 } });
  const [v] = await Review.aggregate<{ avg: number; n: number }>([
    { $match: { vendor: new mongoose.Types.ObjectId(vendorId.toString()), isHidden: false } },
    { $group: { _id: null, avg: { $avg: "$rating" }, n: { $sum: 1 } } },
  ]);
  await VendorProfile.updateOne({ _id: vendorId }, { $set: { rating: v ? Math.round(v.avg * 10) / 10 : 0, reviewCount: v?.n ?? 0 } });
}

/** A customer may review a listing once they've received the product or attended the booking. */
export async function hasCompletedPurchase(userId: Id, listingId: Id) {
  const [order, booking] = await Promise.all([
    Order.exists({ customer: userId, "items.listing": listingId, status: "delivered" }),
    Booking.exists({ customer: userId, listing: listingId, status: "completed" }),
  ]);
  return Boolean(order || booking);
}
