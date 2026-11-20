import "server-only";
import { Listing, type ListingDoc } from "@/server/models/Listing";
import { Category } from "@/server/models/Category";
import { Order } from "@/server/models/Order";
import { Booking } from "@/server/models/Booking";
import { ApiError, assertObjectId } from "@/server/http";
import { deleteImage } from "@/server/cloudinary";
import { uniqueSlug } from "./slugs";
import { getSettings } from "./settings";
import { notifyAdmins } from "./notifications";
import type { ListingInput } from "@/formik/schema/listing";
import type { SessionUser } from "@/server/auth/session";

async function assertCategory(categoryId: string, type: string) {
  assertObjectId(categoryId, "category");
  const cat = await Category.findById(categoryId).lean();
  if (!cat || !cat.isActive) throw new ApiError(422, "Choose an active category.", { category: "Choose an active category" });
  if (cat.type !== "both" && cat.type !== type) {
    throw new ApiError(422, `“${cat.name}” is for ${cat.type}s only.`, { category: `This category is for ${cat.type}s` });
  }
}

function fieldsFrom(input: ListingInput) {
  const isService = input.type === "service";
  return {
    type: input.type,
    title: input.title,
    summary: input.summary,
    description: input.description,
    category: input.category,
    price: input.price,
    compareAtPrice: input.compareAtPrice,
    priceUnit: (isService ? (input.priceUnit === "item" ? "session" : input.priceUnit) : "item") as ListingDoc["priceUnit"],
    stock: isService ? 0 : input.stock,
    sku: input.sku,
    shippingFee: isService ? 0 : input.shippingFee,
    durationMinutes: isService ? input.durationMinutes : undefined,
    availability: isService ? input.availability : undefined,
    location: input.location,
    tags: [...new Set(input.tags)],
    highlights: input.highlights.filter(Boolean),
    images: input.images,
  };
}

export async function createListing(user: SessionUser & { vendorId: string }, input: ListingInput) {
  await assertCategory(input.category, input.type);
  const settings = await getSettings();
  const status = input.submit === "draft" ? "draft" : settings.autoApproveListings ? "approved" : "pending";
  const listing = await Listing.create({
    ...fieldsFrom(input),
    vendor: user.vendorId,
    owner: user.id,
    slug: await uniqueSlug(Listing, input.title),
    currency: settings.currency,
    status,
  });
  if (status === "pending") await notifyAdmins({ type: "listing", title: `New listing to review: ${listing.title}`, link: "/admin/listings?status=pending" });
  return listing;
}

const REVIEWED_FIELDS = ["title", "description", "summary", "images", "category", "type"] as const;

export async function updateListing(user: SessionUser, id: string, input: ListingInput) {
  assertObjectId(id, "listing");
  const listing = await Listing.findById(id);
  if (!listing) throw new ApiError(404, "Listing not found.");
  const isAdmin = user.role === "admin";
  if (!isAdmin && listing.vendor.toString() !== user.vendorId) throw new ApiError(403, "You can only edit your own listings.");
  await assertCategory(input.category, input.type);

  const next = fieldsFrom(input);
  const before = JSON.stringify(REVIEWED_FIELDS.map((f) => listing.get(f)?.toString?.() ?? listing.get(f)));
  const removedImages = listing.images.filter((img) => img.publicId && !next.images.some((n) => n.publicId === img.publicId));
  listing.set(next);
  const after = JSON.stringify(REVIEWED_FIELDS.map((f) => listing.get(f)?.toString?.() ?? listing.get(f)));

  if (!isAdmin) {
    const settings = await getSettings();
    if (input.submit === "draft") listing.status = "draft";
    else if (listing.status === "draft" || listing.status === "rejected" || (listing.status === "approved" && before !== after)) {
      // Content changes on a live listing go back through review.
      listing.status = settings.autoApproveListings ? "approved" : "pending";
      listing.rejectionReason = "";
    }
  }
  await listing.save();
  await Promise.all(removedImages.map((img) => deleteImage(img.publicId)));
  if (listing.status === "pending" && !isAdmin) await notifyAdmins({ type: "listing", title: `Listing updated for review: ${listing.title}`, link: "/admin/listings?status=pending" });
  return listing;
}

/** Deletes a listing, or archives it if customers have orders/bookings that reference it. */
export async function removeListing(user: SessionUser, id: string) {
  assertObjectId(id, "listing");
  const listing = await Listing.findById(id).lean<ListingDoc>();
  if (!listing) throw new ApiError(404, "Listing not found.");
  if (user.role !== "admin" && listing.vendor.toString() !== user.vendorId) throw new ApiError(403, "You can only delete your own listings.");
  const referenced = (await Order.exists({ "items.listing": listing._id })) || (await Booking.exists({ listing: listing._id }));
  if (referenced) {
    await Listing.updateOne({ _id: listing._id }, { $set: { status: "archived", featured: false } });
    return { archived: true };
  }
  await Listing.deleteOne({ _id: listing._id });
  await Promise.all(listing.images.map((img) => (img.publicId ? deleteImage(img.publicId) : null)));
  return { deleted: true };
}
