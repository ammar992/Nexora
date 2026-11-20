import "server-only";
import mongoose from "mongoose";
import { connectDB } from "@/server/db";
import { Order } from "@/server/models/Order";
import { Booking } from "@/server/models/Booking";
import { Payment } from "@/server/models/Payment";
import { User } from "@/server/models/User";
import { VendorProfile } from "@/server/models/VendorProfile";
import { Listing } from "@/server/models/Listing";
import { Review } from "@/server/models/Review";
import { Favorite } from "@/server/models/Favorite";
import { Category } from "@/server/models/Category";
import { toPlain, escapeRegex } from "./serialize";

export const DASH_PAGE_SIZE = 15;

export type ListQuery = { q?: string; status?: string; page?: string; role?: string; type?: string };
type Scope = { vendor?: string; customer?: string };

const pageOf = (q: ListQuery) => Math.max(1, Math.min(1000, Number(q.page) || 1));
const rx = (s?: string) => (s?.trim() ? new RegExp(escapeRegex(s.trim().slice(0, 80)), "i") : null);
const oid = (s: string) => new mongoose.Types.ObjectId(s);

async function paginate<T>(model: mongoose.Model<T>, filter: Record<string, unknown>, q: ListQuery, opts: { sort?: Record<string, 1 | -1>; populate?: [string, string][]; select?: string } = {}) {
  const page = pageOf(q);
  let query = model.find(filter as never).sort(opts.sort ?? { createdAt: -1 }).skip((page - 1) * DASH_PAGE_SIZE).limit(DASH_PAGE_SIZE);
  if (opts.select) query = query.select(opts.select);
  for (const [path, sel] of opts.populate ?? []) query = query.populate(path, sel);
  const [items, total] = await Promise.all([query.lean(), model.countDocuments(filter as never)]);
  return { items: toPlain(items) as unknown[], total, page, pages: Math.max(1, Math.ceil(total / DASH_PAGE_SIZE)) };
}

async function customerIdsMatching(q?: string) {
  const r = rx(q);
  if (!r) return null;
  const users = await User.find({ $or: [{ name: r }, { email: r }] }).select("_id").limit(200).lean();
  return users.map((u) => u._id);
}

async function statusCounts(model: typeof Order | typeof Booking, scope: Record<string, unknown>) {
  const rows = await (model as typeof Order).aggregate<{ _id: string; n: number }>([{ $match: scope }, { $group: { _id: "$status", n: { $sum: 1 } } }]);
  return Object.fromEntries(rows.map((r) => [r._id, r.n])) as Record<string, number>;
}

export async function listOrders(scope: Scope, q: ListQuery) {
  await connectDB();
  const base: Record<string, unknown> = {};
  if (scope.vendor) base.vendor = oid(scope.vendor);
  if (scope.customer) base.customer = oid(scope.customer);
  const filter: Record<string, unknown> = { ...base };
  if (q.status) filter.status = q.status;
  const r = rx(q.q);
  if (r) {
    const ids = await customerIdsMatching(q.q);
    filter.$or = [{ reference: r }, { "items.title": r }, ...(ids?.length ? [{ customer: { $in: ids } }] : [])];
  }
  const [result, counts] = await Promise.all([
    paginate(Order, filter, q, { populate: [["customer", "name email avatar"], ["vendor", "storeName slug"]] }),
    statusCounts(Order, base),
  ]);
  return { ...result, counts };
}

export async function listBookings(scope: Scope, q: ListQuery & { when?: string }) {
  await connectDB();
  const base: Record<string, unknown> = {};
  if (scope.vendor) base.vendor = oid(scope.vendor);
  if (scope.customer) base.customer = oid(scope.customer);
  const filter: Record<string, unknown> = { ...base };
  if (q.status) filter.status = q.status;
  const today = new Date().toISOString().slice(0, 10);
  if (q.when === "upcoming") filter.date = { $gte: today };
  if (q.when === "past") filter.date = { $lt: today };
  const r = rx(q.q);
  if (r) {
    const ids = await customerIdsMatching(q.q);
    filter.$or = [{ reference: r }, { "listingSnapshot.title": r }, { "contact.name": r }, ...(ids?.length ? [{ customer: { $in: ids } }] : [])];
  }
  const sort: Record<string, 1 | -1> = q.when === "upcoming" ? { date: 1, timeSlot: 1 } : { createdAt: -1 };
  const [result, counts] = await Promise.all([
    paginate(Booking, filter, q, { sort, populate: [["customer", "name email avatar"], ["vendor", "storeName slug"], ["listing", "slug"]] }),
    statusCounts(Booking, base),
  ]);
  return { ...result, counts };
}

export async function getOrderForViewer(id: string, viewer: { id: string; role: string; vendorId: string | null }) {
  await connectDB();
  if (!mongoose.isValidObjectId(id)) return null;
  const o = await Order.findById(id).populate("customer", "name email phone").populate("vendor", "storeName slug contactEmail").populate("payment", "provider status reference paidAt").lean();
  if (!o) return null;
  const vendorId = (o.vendor as unknown as { _id: mongoose.Types.ObjectId })._id.toString();
  const customerId = (o.customer as unknown as { _id: mongoose.Types.ObjectId })._id.toString();
  if (viewer.role !== "admin" && viewer.id !== customerId && viewer.vendorId !== vendorId) return null;
  return toPlain(o);
}

export async function getBookingForViewer(id: string, viewer: { id: string; role: string; vendorId: string | null }) {
  await connectDB();
  if (!mongoose.isValidObjectId(id)) return null;
  const b = await Booking.findById(id).populate("customer", "name email phone").populate("vendor", "storeName slug contactEmail location").populate("listing", "slug").populate("payment", "provider status reference paidAt").lean();
  if (!b) return null;
  const vendorId = (b.vendor as unknown as { _id: mongoose.Types.ObjectId })._id.toString();
  const customerId = (b.customer as unknown as { _id: mongoose.Types.ObjectId })._id.toString();
  if (viewer.role !== "admin" && viewer.id !== customerId && viewer.vendorId !== vendorId) return null;
  return toPlain(b);
}

export async function listPayments(scope: { customer?: string }, q: ListQuery) {
  await connectDB();
  const filter: Record<string, unknown> = {};
  if (scope.customer) filter.customer = oid(scope.customer);
  if (q.status) filter.status = q.status;
  const r = rx(q.q);
  if (r) {
    const ids = await customerIdsMatching(q.q);
    filter.$or = [{ reference: r }, ...(ids?.length ? [{ customer: { $in: ids } }] : [])];
  }
  return paginate(Payment, filter, q, { populate: [["customer", "name email"], ["orders", "reference"], ["booking", "reference listingSnapshot.title"]] });
}

export async function listUsers(q: ListQuery) {
  await connectDB();
  const filter: Record<string, unknown> = {};
  if (q.role) filter.role = q.role;
  if (q.status === "active") filter.isActive = true;
  if (q.status === "inactive") filter.isActive = false;
  const r = rx(q.q);
  if (r) filter.$or = [{ name: r }, { email: r }];
  const [result, roleRows] = await Promise.all([
    paginate(User, filter, q, { select: "name email role avatar isActive emailVerified createdAt lastLoginAt" }),
    User.aggregate<{ _id: string; n: number }>([{ $group: { _id: "$role", n: { $sum: 1 } } }]),
  ]);
  return { ...result, counts: Object.fromEntries(roleRows.map((r) => [r._id, r.n])) as Record<string, number> };
}

export async function listVendorsAdmin(q: ListQuery) {
  await connectDB();
  const filter: Record<string, unknown> = {};
  if (q.status) filter.status = q.status;
  const r = rx(q.q);
  if (r) filter.$or = [{ storeName: r }, { contactEmail: r }, { "location.city": r }];
  const [result, rows] = await Promise.all([
    paginate(VendorProfile, filter, q, { populate: [["user", "name email"]] }),
    VendorProfile.aggregate<{ _id: string; n: number }>([{ $group: { _id: "$status", n: { $sum: 1 } } }]),
  ]);
  const ids = (result.items as { _id: string }[]).map((v) => oid(v._id));
  const [listingCounts, orderStats] = await Promise.all([
    Listing.aggregate<{ _id: mongoose.Types.ObjectId; n: number }>([{ $match: { vendor: { $in: ids }, status: "approved" } }, { $group: { _id: "$vendor", n: { $sum: 1 } } }]),
    Order.aggregate<{ _id: mongoose.Types.ObjectId; n: number }>([{ $match: { vendor: { $in: ids } } }, { $unionWith: { coll: "bookings", pipeline: [{ $match: { vendor: { $in: ids } } }] } }, { $group: { _id: "$vendor", n: { $sum: 1 } } }]),
  ]);
  const lc = new Map(listingCounts.map((x) => [x._id.toString(), x.n]));
  const oc = new Map(orderStats.map((x) => [x._id.toString(), x.n]));
  return {
    ...result,
    items: (result.items as { _id: string }[]).map((v) => ({ ...v, liveListings: lc.get(v._id) ?? 0, salesCount: oc.get(v._id) ?? 0 })),
    counts: Object.fromEntries(rows.map((r) => [r._id, r.n])) as Record<string, number>,
  };
}

export async function listListings(scope: { vendor?: string }, q: ListQuery) {
  await connectDB();
  const base: Record<string, unknown> = {};
  if (scope.vendor) base.vendor = oid(scope.vendor);
  const filter: Record<string, unknown> = { ...base };
  if (q.status) filter.status = q.status;
  if (q.type === "product" || q.type === "service") filter.type = q.type;
  const r = rx(q.q);
  if (r) filter.$or = [{ title: r }, { tags: r }, { sku: r }];
  const [result, rows] = await Promise.all([
    paginate(Listing, filter, q, { sort: { updatedAt: -1 }, select: "title slug type price stock status featured images rating reviewCount salesCount views vendor category updatedAt rejectionReason priceUnit currency", populate: [["vendor", "storeName slug"], ["category", "name"]] }),
    Listing.aggregate<{ _id: string; n: number }>([{ $match: base }, { $group: { _id: "$status", n: { $sum: 1 } } }]),
  ]);
  return { ...result, counts: Object.fromEntries(rows.map((r) => [r._id, r.n])) as Record<string, number> };
}

export async function listReviews(scope: { vendor?: string; author?: string }, q: ListQuery) {
  await connectDB();
  const filter: Record<string, unknown> = {};
  if (scope.vendor) filter.vendor = oid(scope.vendor);
  if (scope.author) filter.author = oid(scope.author);
  if (q.status === "hidden") filter.isHidden = true;
  if (q.status === "unreplied") filter["vendorReply.text"] = { $in: [null, ""] };
  const r = rx(q.q);
  if (r) filter.$or = [{ comment: r }, { title: r }];
  return paginate(Review, filter, q, { populate: [["author", "name avatar email"], ["listing", "title slug images"], ["vendor", "storeName"]] });
}

/** Customers who have ordered or booked with a vendor, with lifetime totals. */
export async function listVendorCustomers(vendorId: string, q: ListQuery) {
  await connectDB();
  const v = oid(vendorId);
  const page = pageOf(q);
  const rows = await Order.aggregate<{ _id: mongoose.Types.ObjectId; orders: number; bookings: number; spent: number; last: Date }>([
    { $match: { vendor: v } },
    { $project: { customer: 1, total: 1, createdAt: 1, paymentStatus: 1, o: { $literal: 1 }, b: { $literal: 0 } } },
    { $unionWith: { coll: "bookings", pipeline: [{ $match: { vendor: v } }, { $project: { customer: 1, total: 1, createdAt: 1, paymentStatus: 1, o: { $literal: 0 }, b: { $literal: 1 } } }] } },
    { $group: { _id: "$customer", orders: { $sum: "$o" }, bookings: { $sum: "$b" }, spent: { $sum: { $cond: [{ $eq: ["$paymentStatus", "paid"] }, "$total", 0] } }, last: { $max: "$createdAt" } } },
    { $sort: { last: -1 } },
  ]);
  const users = await User.find({ _id: { $in: rows.map((r) => r._id) } }).select("name email avatar phone").lean();
  const umap = new Map(users.map((u) => [u._id.toString(), u]));
  const r = rx(q.q);
  const all = rows
    .map((row) => ({ id: row._id.toString(), name: umap.get(row._id.toString())?.name ?? "Deleted user", email: umap.get(row._id.toString())?.email ?? "", phone: umap.get(row._id.toString())?.phone ?? "", avatar: umap.get(row._id.toString())?.avatar ?? "", orders: row.orders, bookings: row.bookings, spent: Math.round(row.spent * 100) / 100, last: row.last.toISOString() }))
    .filter((c) => !r || r.test(c.name) || r.test(c.email));
  return { items: all.slice((page - 1) * DASH_PAGE_SIZE, page * DASH_PAGE_SIZE), total: all.length, page, pages: Math.max(1, Math.ceil(all.length / DASH_PAGE_SIZE)) };
}

/** Paid and refunded sales (orders + bookings) for a vendor's earnings ledger. */
export async function listVendorTransactions(vendorId: string, q: ListQuery) {
  await connectDB();
  const v = oid(vendorId);
  const page = pageOf(q);
  const match: Record<string, unknown> = { vendor: v, paymentStatus: { $in: ["paid", "refunded"] } };
  const project = { reference: 1, total: 1, commission: 1, vendorEarnings: 1, currency: 1, paymentStatus: 1, paymentMethod: 1, status: 1, createdAt: 1 };
  const [rows, count] = await Promise.all([
    Order.aggregate([
      { $match: match },
      { $project: { ...project, kind: { $literal: "order" }, label: { $first: "$items.title" } } },
      { $unionWith: { coll: "bookings", pipeline: [{ $match: match }, { $project: { ...project, kind: { $literal: "booking" }, label: "$listingSnapshot.title" } }] } },
      { $sort: { createdAt: -1 } },
      { $skip: (page - 1) * DASH_PAGE_SIZE },
      { $limit: DASH_PAGE_SIZE },
    ]),
    Promise.all([Order.countDocuments(match as never), Booking.countDocuments(match as never)]).then(([a, b]) => a + b),
  ]);
  return { items: toPlain(rows) as { _id: string; reference: string; kind: string; label: string; total: number; commission: number; vendorEarnings: number; currency: string; paymentStatus: string; paymentMethod: string; status: string; createdAt: string }[], total: count, page, pages: Math.max(1, Math.ceil(count / DASH_PAGE_SIZE)) };
}

export async function getCustomerOverview(userId: string) {
  await connectDB();
  const u = oid(userId);
  const today = new Date().toISOString().slice(0, 10);
  const [orders, activeOrders, upcoming, saved, reviews, recentOrders, nextBookings] = await Promise.all([
    Order.countDocuments({ customer: u }),
    Order.countDocuments({ customer: u, status: { $in: ["pending_payment", "processing", "shipped"] } }),
    Booking.countDocuments({ customer: u, status: { $in: ["pending", "confirmed"] }, date: { $gte: today } }),
    Favorite.countDocuments({ user: u }),
    Review.countDocuments({ author: u }),
    Order.find({ customer: u }).sort({ createdAt: -1 }).limit(4).populate("vendor", "storeName").lean(),
    Booking.find({ customer: u, status: { $in: ["pending", "confirmed", "pending_payment"] }, date: { $gte: today } }).sort({ date: 1, timeSlot: 1 }).limit(4).populate("vendor", "storeName").lean(),
  ]);
  return { counts: { orders, activeOrders, upcoming, saved, reviews }, recentOrders: toPlain(recentOrders), nextBookings: toPlain(nextBookings) };
}

export async function getSavedListings(userId: string) {
  await connectDB();
  const favs = await Favorite.find({ user: userId }).sort({ createdAt: -1 }).select("listing").lean();
  return favs.map((f) => f.listing.toString());
}

export async function listCategoriesAdmin() {
  await connectDB();
  const [cats, counts] = await Promise.all([
    Category.find().sort({ sortOrder: 1, name: 1 }).lean(),
    Listing.aggregate<{ _id: mongoose.Types.ObjectId; n: number }>([{ $group: { _id: "$category", n: { $sum: 1 } } }]),
  ]);
  const m = new Map(counts.map((c) => [c._id.toString(), c.n]));
  return toPlain(cats).map((c) => ({ ...c, listings: m.get(c._id) ?? 0 }));
}
