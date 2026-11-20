import "server-only";
import mongoose from "mongoose";
import { connectDB } from "@/server/db";
import { Listing } from "@/server/models/Listing";
import { Category } from "@/server/models/Category";
import { VendorProfile } from "@/server/models/VendorProfile";
import { Review } from "@/server/models/Review";
import { Favorite } from "@/server/models/Favorite";
import { toPlain, escapeRegex } from "./serialize";
import { PAGE_SIZE } from "@/resources/utils/constant";

export type ListingCard = {
  _id: string;
  slug: string;
  title: string;
  summary: string;
  type: "product" | "service";
  price: number;
  compareAtPrice?: number;
  priceUnit: string;
  currency: string;
  image: string;
  imageAlt: string;
  rating: number;
  reviewCount: number;
  location: { city: string; country: string; remote: boolean };
  featured: boolean;
  stock: number;
  category: { name: string; slug: string } | null;
  vendor: { storeName: string; slug: string; logo: string } | null;
};

const CARD_PROJECTION = {
  slug: 1, title: 1, summary: 1, type: 1, price: 1, compareAtPrice: 1, priceUnit: 1, currency: 1,
  images: { $slice: 1 }, rating: 1, reviewCount: 1, location: 1, featured: 1, stock: 1, category: 1, vendor: 1,
} as const;

type RawCard = {
  _id: mongoose.Types.ObjectId; slug: string; title: string; summary?: string; type: "product" | "service";
  price: number; compareAtPrice?: number; priceUnit?: string; currency?: string;
  images?: { url: string; alt?: string }[]; rating?: number; reviewCount?: number;
  location?: { city?: string; country?: string; remote?: boolean }; featured?: boolean; stock?: number;
  category?: { name: string; slug: string } | null; vendor?: { storeName: string; slug: string; logo?: string } | null;
};

function toCard(l: RawCard): ListingCard {
  return {
    _id: l._id.toString(),
    slug: l.slug,
    title: l.title,
    summary: l.summary ?? "",
    type: l.type,
    price: l.price,
    compareAtPrice: l.compareAtPrice,
    priceUnit: l.priceUnit ?? "item",
    currency: l.currency ?? "USD",
    image: l.images?.[0]?.url ?? "",
    imageAlt: l.images?.[0]?.alt || l.title,
    rating: l.rating ?? 0,
    reviewCount: l.reviewCount ?? 0,
    location: { city: l.location?.city ?? "", country: l.location?.country ?? "", remote: !!l.location?.remote },
    featured: !!l.featured,
    stock: l.stock ?? 0,
    category: l.category ? { name: l.category.name, slug: l.category.slug } : null,
    vendor: l.vendor ? { storeName: l.vendor.storeName, slug: l.vendor.slug, logo: l.vendor.logo ?? "" } : null,
  };
}

async function cards(filter: Record<string, unknown>, sort: Record<string, 1 | -1>, limit: number, skip = 0) {
  const docs = await Listing.find(filter, CARD_PROJECTION)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .populate("category", "name slug")
    .populate("vendor", "storeName slug logo")
    .lean();
  return (docs as unknown as RawCard[]).map(toCard);
}

export type SearchParams = {
  q?: string;
  category?: string;
  type?: string;
  minPrice?: string;
  maxPrice?: string;
  city?: string;
  rating?: string;
  sort?: string;
  page?: string;
  vendor?: string;
};

export async function searchListings(params: SearchParams) {
  await connectDB();
  const filter: Record<string, unknown> = { status: "approved" };
  const q = params.q?.trim().slice(0, 100);
  if (q) filter.$text = { $search: q };
  if (params.type === "product" || params.type === "service") filter.type = params.type;
  if (params.category) {
    const cat = await Category.findOne({ slug: params.category }).select("_id").lean();
    filter.category = cat?._id ?? new mongoose.Types.ObjectId();
  }
  if (params.vendor) {
    const v = await VendorProfile.findOne({ slug: params.vendor }).select("_id").lean();
    filter.vendor = v?._id ?? new mongoose.Types.ObjectId();
  }
  const min = Number(params.minPrice);
  const max = Number(params.maxPrice);
  if (Number.isFinite(min) && min > 0) filter.price = { ...(filter.price as object), $gte: min };
  if (Number.isFinite(max) && max > 0) filter.price = { ...(filter.price as object), $lte: max };
  if (params.city?.trim()) filter["location.city"] = new RegExp(`^${escapeRegex(params.city.trim().slice(0, 60))}`, "i");
  const minRating = Number(params.rating);
  if (Number.isFinite(minRating) && minRating > 0) filter.rating = { $gte: minRating };

  const sortMap: Record<string, Record<string, 1 | -1>> = {
    newest: { createdAt: -1 },
    price_asc: { price: 1 },
    price_desc: { price: -1 },
    rating: { rating: -1, reviewCount: -1 },
    popular: { salesCount: -1, views: -1 },
  };
  const sortKey = params.sort && sortMap[params.sort] ? params.sort : q ? "relevance" : "newest";
  const page = Math.max(1, Math.min(500, Number(params.page) || 1));

  const total = await Listing.countDocuments(filter);
  let items: ListingCard[];
  if (sortKey === "relevance" && q) {
    const docs = await Listing.find(filter, { ...CARD_PROJECTION, score: { $meta: "textScore" } })
      .sort({ score: { $meta: "textScore" } })
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE)
      .populate("category", "name slug")
      .populate("vendor", "storeName slug logo")
      .lean();
    items = (docs as unknown as RawCard[]).map(toCard);
  } else {
    items = await cards(filter, sortMap[sortKey] ?? { createdAt: -1 }, PAGE_SIZE, (page - 1) * PAGE_SIZE);
  }
  return { items, total, page, pages: Math.max(1, Math.ceil(total / PAGE_SIZE)), sort: sortKey };
}

export async function getFeaturedListings(limit = 8) {
  await connectDB();
  const featured = await cards({ status: "approved", featured: true }, { updatedAt: -1 }, limit);
  if (featured.length >= 4) return featured;
  const extra = await cards({ status: "approved", featured: { $ne: true } }, { rating: -1, createdAt: -1 }, limit - featured.length);
  return [...featured, ...extra];
}

export async function getTrendingListings(type: "product" | "service", limit = 8) {
  await connectDB();
  return cards({ status: "approved", type }, { salesCount: -1, views: -1, rating: -1 }, limit);
}

export async function getCategoriesWithCounts() {
  await connectDB();
  const [cats, counts] = await Promise.all([
    Category.find({ isActive: true }).sort({ sortOrder: 1, name: 1 }).lean(),
    Listing.aggregate<{ _id: mongoose.Types.ObjectId; n: number }>([
      { $match: { status: "approved" } },
      { $group: { _id: "$category", n: { $sum: 1 } } },
    ]),
  ]);
  const map = new Map(counts.map((c) => [c._id.toString(), c.n]));
  return cats.map((c) => ({
    _id: c._id.toString(),
    name: c.name,
    slug: c.slug,
    description: c.description ?? "",
    icon: c.icon ?? "Sparkles",
    image: c.image ?? "",
    type: c.type,
    count: map.get(c._id.toString()) ?? 0,
  }));
}
export type CategoryWithCount = Awaited<ReturnType<typeof getCategoriesWithCounts>>[number];

export type FeaturedVendor = {
  _id: string; storeName: string; slug: string; tagline: string; logo: string; coverImage: string; city: string;
  rating: number; reviewCount: number; listingCount: number; previews: { url: string; title: string }[];
};

export async function getFeaturedVendors(limit = 6) {
  await connectDB();
  const ids = await VendorProfile.find({ status: "approved" }).sort({ featured: -1, rating: -1, totalSales: -1 }).limit(limit).select("_id").lean();
  return getFeaturedVendorsByIds(ids.map((i) => i._id));
}

/** Public vendor directory (search + pagination). */
export async function listVendors(params: { q?: string; page?: string }) {
  await connectDB();
  const filter: Record<string, unknown> = { status: "approved" };
  const q = params.q?.trim().slice(0, 80);
  if (q) filter.$or = [{ storeName: new RegExp(escapeRegex(q), "i") }, { tagline: new RegExp(escapeRegex(q), "i") }, { "location.city": new RegExp(escapeRegex(q), "i") }];
  const page = Math.max(1, Number(params.page) || 1);
  const total = await VendorProfile.countDocuments(filter);
  const ids = await VendorProfile.find(filter).sort({ featured: -1, rating: -1, totalSales: -1 }).skip((page - 1) * PAGE_SIZE).limit(PAGE_SIZE).select("_id").lean();
  const all = await getFeaturedVendorsByIds(ids.map((i) => i._id));
  return { items: all, total, page, pages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

async function getFeaturedVendorsByIds(ids: mongoose.Types.ObjectId[]) {
  if (!ids.length) return [] as FeaturedVendor[];
  const rows = await VendorProfile.aggregate([
    { $match: { _id: { $in: ids } } },
    { $lookup: { from: "listings", let: { v: "$_id" }, pipeline: [{ $match: { $expr: { $eq: ["$vendor", "$$v"] }, status: "approved" } }, { $sort: { rating: -1 } }, { $limit: 3 }, { $project: { images: { $slice: ["$images", 1] }, title: 1 } }], as: "top" } },
    { $lookup: { from: "listings", let: { v: "$_id" }, pipeline: [{ $match: { $expr: { $eq: ["$vendor", "$$v"] }, status: "approved" } }, { $count: "n" }], as: "cnt" } },
  ]);
  const order = new Map(ids.map((id, i) => [id.toString(), i]));
  return rows
    .sort((a, b) => (order.get(String(a._id)) ?? 0) - (order.get(String(b._id)) ?? 0))
    .map((v) => ({
      _id: String(v._id),
      storeName: v.storeName as string,
      slug: v.slug as string,
      tagline: (v.tagline as string) ?? "",
      logo: (v.logo as string) ?? "",
      coverImage: (v.coverImage as string) ?? "",
      city: (v.location?.city as string) ?? "",
      rating: (v.rating as number) ?? 0,
      reviewCount: (v.reviewCount as number) ?? 0,
      listingCount: (v.cnt?.[0]?.n as number) ?? 0,
      previews: ((v.top as { images?: { url: string }[]; title: string }[]) ?? []).map((t) => ({ url: t.images?.[0]?.url ?? "", title: t.title })),
    }));
}

export async function getListingDetail(slug: string) {
  await connectDB();
  const listing = await Listing.findOne({ slug })
    .populate("category", "name slug")
    .populate("vendor", "storeName slug logo tagline description location rating reviewCount createdAt status user")
    .lean();
  if (!listing) return null;
  return toPlain(listing);
}
export type ListingDetail = NonNullable<Awaited<ReturnType<typeof getListingDetail>>>;

export async function getListingReviews(listingId: string, limit = 20) {
  await connectDB();
  const reviews = await Review.find({ listing: listingId, isHidden: false })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("author", "name avatar")
    .lean();
  const breakdown = await Review.aggregate<{ _id: number; n: number }>([
    { $match: { listing: new mongoose.Types.ObjectId(listingId), isHidden: false } },
    { $group: { _id: "$rating", n: { $sum: 1 } } },
  ]);
  return { reviews: toPlain(reviews), breakdown: Object.fromEntries(breakdown.map((b) => [b._id, b.n])) as Record<number, number> };
}
export type ListingReview = Awaited<ReturnType<typeof getListingReviews>>["reviews"][number];

export async function getRelatedListings(listing: { _id: string; category?: { _id?: string } | string | null; type: string }, limit = 4) {
  await connectDB();
  const catId = typeof listing.category === "string" ? listing.category : listing.category?._id;
  return cards({ status: "approved", _id: { $ne: listing._id }, ...(catId ? { category: catId } : { type: listing.type }) }, { rating: -1, salesCount: -1 }, limit);
}

export async function getVendorStorefront(slug: string) {
  await connectDB();
  const vendor = await VendorProfile.findOne({ slug, status: "approved" }).lean();
  if (!vendor) return null;
  const listings = await cards({ status: "approved", vendor: vendor._id }, { featured: -1, rating: -1 }, 60);
  return { vendor: toPlain(vendor), listings };
}

/** Cards for a known set of listing ids, kept in the given order (used for saved lists). */
export async function getListingCardsByIds(ids: string[]) {
  await connectDB();
  if (!ids.length) return [] as ListingCard[];
  const list = await cards({ _id: { $in: ids }, status: "approved" }, { createdAt: -1 }, 200);
  const order = new Map(ids.map((id, i) => [id, i]));
  return list.sort((a, b) => (order.get(a._id) ?? 0) - (order.get(b._id) ?? 0));
}

export async function getFavoriteIds(userId: string | undefined) {
  if (!userId) return [] as string[];
  await connectDB();
  const favs = await Favorite.find({ user: userId }).select("listing").lean();
  return favs.map((f) => f.listing.toString());
}

export async function getHomeTestimonials(limit = 6) {
  await connectDB();
  const reviews = await Review.find({ isHidden: false, rating: { $gte: 4 }, verified: true })
    .sort({ rating: -1, createdAt: -1 })
    .limit(limit)
    .populate("author", "name avatar")
    .populate("listing", "title slug")
    .lean();
  return toPlain(reviews) as unknown as {
    _id: string; rating: number; title: string; comment: string; createdAt: string;
    author: { name: string; avatar?: string } | null; listing: { title: string; slug: string } | null;
  }[];
}

export async function getMarketplaceStats() {
  await connectDB();
  const [listings, vendors, reviews, cities] = await Promise.all([
    Listing.countDocuments({ status: "approved" }),
    VendorProfile.countDocuments({ status: "approved" }),
    Review.countDocuments({ isHidden: false }),
    Listing.distinct("location.city", { status: "approved" }),
  ]);
  return { listings, vendors, reviews, cities: cities.filter(Boolean).length };
}
