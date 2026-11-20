import "server-only";
import { Category } from "@/server/models/Category";
import { Listing } from "@/server/models/Listing";
import { DEFAULT_AVAILABILITY } from "@/resources/utils/slots";
import { connectDB } from "@/server/db";

export async function activeCategoryOptions() {
  await connectDB();
  const cats = await Category.find({ isActive: true }).sort({ sortOrder: 1, name: 1 }).select("name type").lean();
  return cats.map((c) => ({ _id: c._id.toString(), name: c.name, type: c.type }));
}

/** Loads a listing in the shape the ListingForm expects. */
export async function listingFormValues(id: string) {
  await connectDB();
  const l = await Listing.findById(id).lean();
  if (!l) return null;
  const av = l.availability;
  return {
    vendorId: l.vendor.toString(),
    status: l.status,
    slug: l.slug,
    values: {
      type: l.type,
      title: l.title,
      summary: l.summary ?? "",
      description: l.description,
      category: l.category.toString(),
      price: l.price,
      compareAtPrice: (l.compareAtPrice ?? "") as number | "",
      priceUnit: l.priceUnit ?? "item",
      stock: l.stock ?? 0,
      sku: l.sku ?? "",
      shippingFee: l.shippingFee ?? 0,
      durationMinutes: (l.durationMinutes ?? 60) as number | "",
      availability: av
        ? { days: av.days, startTime: av.startTime, endTime: av.endTime, slotMinutes: av.slotMinutes, capacityPerSlot: av.capacityPerSlot, blockedDates: av.blockedDates, leadTimeHours: av.leadTimeHours, maxAdvanceDays: av.maxAdvanceDays }
        : DEFAULT_AVAILABILITY,
      location: { city: l.location?.city ?? "", country: l.location?.country ?? "", remote: !!l.location?.remote },
      tags: l.tags ?? [],
      highlights: l.highlights ?? [],
      images: (l.images ?? []).map((i) => ({ url: i.url, publicId: i.publicId ?? "", alt: i.alt ?? "" })),
    },
  };
}
