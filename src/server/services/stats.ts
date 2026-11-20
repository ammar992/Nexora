import "server-only";
import mongoose from "mongoose";
import { connectDB } from "@/server/db";
import { User } from "@/server/models/User";
import { VendorProfile } from "@/server/models/VendorProfile";
import { Listing } from "@/server/models/Listing";
import { Order } from "@/server/models/Order";
import { Booking } from "@/server/models/Booking";
import { Payment } from "@/server/models/Payment";
import { Review } from "@/server/models/Review";
import { toPlain } from "./serialize";

export type SeriesPoint = { label: string; revenue: number; commission: number; count: number };

function lastMonths(n: number) {
  const out: { key: string; label: string }[] = [];
  const d = new Date();
  d.setDate(1);
  for (let i = n - 1; i >= 0; i--) {
    const m = new Date(d.getFullYear(), d.getMonth() - i, 1);
    out.push({ key: `${m.getFullYear()}-${m.getMonth() + 1}`, label: m.toLocaleDateString("en-US", { month: "short" }) });
  }
  return out;
}

type SeriesRow = { _id: { y: number; m: number }; revenue: number; commission: number; count: number };

async function monthlySeries(match: Record<string, unknown>, revenueField: "$total" | "$vendorEarnings", months = 12): Promise<SeriesPoint[]> {
  const since = new Date();
  since.setMonth(since.getMonth() - (months - 1), 1);
  since.setHours(0, 0, 0, 0);
  const stage = (model: typeof Order | typeof Booking) =>
    (model as typeof Order).aggregate<SeriesRow>([
      { $match: { ...match, paymentStatus: "paid", createdAt: { $gte: since } } },
      { $group: { _id: { y: { $year: "$createdAt" }, m: { $month: "$createdAt" } }, revenue: { $sum: revenueField }, commission: { $sum: "$commission" }, count: { $sum: 1 } } },
    ]);
  const [o, b] = await Promise.all([stage(Order), stage(Booking)]);
  const map = new Map<string, SeriesPoint>();
  for (const r of [...o, ...b]) {
    const k = `${r._id.y}-${r._id.m}`;
    const cur = map.get(k) ?? { label: "", revenue: 0, commission: 0, count: 0 };
    map.set(k, { label: "", revenue: cur.revenue + r.revenue, commission: cur.commission + r.commission, count: cur.count + r.count });
  }
  return lastMonths(months).map(({ key, label }) => {
    const v = map.get(key);
    return { label, revenue: Math.round((v?.revenue ?? 0) * 100) / 100, commission: Math.round((v?.commission ?? 0) * 100) / 100, count: v?.count ?? 0 };
  });
}

async function sumPaid(model: typeof Order | typeof Booking, match: Record<string, unknown>) {
  const [r] = await (model as typeof Order).aggregate<{ total: number; commission: number; earnings: number }>([
    { $match: { ...match, paymentStatus: "paid" } },
    { $group: { _id: null, total: { $sum: "$total" }, commission: { $sum: "$commission" }, earnings: { $sum: "$vendorEarnings" } } },
  ]);
  return r ?? { total: 0, commission: 0, earnings: 0 };
}

export async function getAdminOverview() {
  await connectDB();
  const [users, vendors, pendingVendors, listings, pendingListings, orders, bookings, oSum, bSum, series, recentOrders, recentBookings, recentUsers, recentVendors, byType] = await Promise.all([
    User.countDocuments(),
    VendorProfile.countDocuments({ status: "approved" }),
    VendorProfile.countDocuments({ status: "pending" }),
    Listing.countDocuments({ status: "approved" }),
    Listing.countDocuments({ status: "pending" }),
    Order.countDocuments(),
    Booking.countDocuments(),
    sumPaid(Order, {}),
    sumPaid(Booking, {}),
    monthlySeries({}, "$total"),
    Order.find().sort({ createdAt: -1 }).limit(5).populate("customer", "name").select("reference total currency status createdAt customer").lean(),
    Booking.find().sort({ createdAt: -1 }).limit(5).populate("customer", "name").select("reference total currency status createdAt customer listingSnapshot.title").lean(),
    User.find().sort({ createdAt: -1 }).limit(5).select("name email role createdAt").lean(),
    VendorProfile.find().sort({ createdAt: -1 }).limit(5).select("storeName status createdAt").lean(),
    Listing.aggregate<{ _id: string; n: number }>([{ $match: { status: "approved" } }, { $group: { _id: "$type", n: { $sum: 1 } } }]),
  ]);

  type Activity = { kind: string; title: string; detail: string; at: string; href: string };
  const activity: Activity[] = [
    ...recentOrders.map((o) => ({ kind: "order", title: `Order ${o.reference}`, detail: `${(o.customer as unknown as { name?: string })?.name ?? "Customer"} · ${o.status}`, at: o.createdAt.toISOString(), href: `/admin/orders?q=${o.reference}` })),
    ...recentBookings.map((b) => ({ kind: "booking", title: `Booking ${b.reference}`, detail: `${b.listingSnapshot?.title ?? ""} · ${b.status}`, at: b.createdAt.toISOString(), href: `/admin/bookings?q=${b.reference}` })),
    ...recentUsers.map((u) => ({ kind: "user", title: `${u.name} joined`, detail: `${u.email} · ${u.role}`, at: u.createdAt.toISOString(), href: `/admin/users?q=${encodeURIComponent(u.email)}` })),
    ...recentVendors.map((v) => ({ kind: "vendor", title: `${v.storeName} applied`, detail: v.status, at: v.createdAt.toISOString(), href: `/admin/vendors?status=${v.status}` })),
  ]
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 10);

  return {
    totals: {
      users,
      vendors,
      pendingVendors,
      listings,
      pendingListings,
      orders,
      bookings,
      gmv: Math.round((oSum.total + bSum.total) * 100) / 100,
      commission: Math.round((oSum.commission + bSum.commission) * 100) / 100,
    },
    series,
    activity,
    listingMix: [
      { name: "Products", value: byType.find((t) => t._id === "product")?.n ?? 0 },
      { name: "Services", value: byType.find((t) => t._id === "service")?.n ?? 0 },
    ],
  };
}

export async function getVendorOverview(vendorId: string) {
  await connectDB();
  const vid = new mongoose.Types.ObjectId(vendorId);
  const [oSum, bSum, orders, bookings, activeListings, pendingListings, series, recentOrders, upcoming, topListings, reviews] = await Promise.all([
    sumPaid(Order, { vendor: vid }),
    sumPaid(Booking, { vendor: vid }),
    Order.countDocuments({ vendor: vid }),
    Booking.countDocuments({ vendor: vid }),
    Listing.countDocuments({ vendor: vid, status: "approved" }),
    Listing.countDocuments({ vendor: vid, status: "pending" }),
    monthlySeries({ vendor: vid }, "$vendorEarnings"),
    Order.find({ vendor: vid }).sort({ createdAt: -1 }).limit(5).populate("customer", "name").select("reference total currency status paymentStatus createdAt customer items").lean(),
    Booking.find({ vendor: vid, status: { $in: ["pending", "confirmed"] }, date: { $gte: new Date().toISOString().slice(0, 10) } })
      .sort({ date: 1, timeSlot: 1 })
      .limit(5)
      .populate("customer", "name")
      .select("reference date timeSlot guests status listingSnapshot customer total currency")
      .lean(),
    Listing.find({ vendor: vid }).sort({ salesCount: -1, views: -1 }).limit(5).select("title slug salesCount views rating price type images stock status").lean(),
    Review.countDocuments({ vendor: vid }),
  ]);
  const pendingPayout = await Promise.all([
    sumPaid(Order, { vendor: vid, status: { $in: ["processing", "shipped"] } }),
    sumPaid(Booking, { vendor: vid, status: "confirmed" }),
  ]);
  return {
    totals: {
      earnings: Math.round((oSum.earnings + bSum.earnings) * 100) / 100,
      gross: Math.round((oSum.total + bSum.total) * 100) / 100,
      commission: Math.round((oSum.commission + bSum.commission) * 100) / 100,
      inProgress: Math.round((pendingPayout[0].earnings + pendingPayout[1].earnings) * 100) / 100,
      orders,
      bookings,
      activeListings,
      pendingListings,
      reviews,
    },
    series,
    recentOrders: toPlain(recentOrders),
    upcoming: toPlain(upcoming),
    topListings: toPlain(topListings),
  };
}

export async function getFinanceSummary() {
  await connectDB();
  const [byStatus, byProvider, oSum, bSum, series] = await Promise.all([
    Payment.aggregate<{ _id: string; n: number; amount: number }>([{ $group: { _id: "$status", n: { $sum: 1 }, amount: { $sum: "$amount" } } }]),
    Payment.aggregate<{ _id: string; n: number; amount: number }>([{ $match: { status: "paid" } }, { $group: { _id: "$provider", n: { $sum: 1 }, amount: { $sum: "$amount" } } }]),
    sumPaid(Order, {}),
    sumPaid(Booking, {}),
    monthlySeries({}, "$total"),
  ]);
  const topVendors = await Order.aggregate<{ _id: mongoose.Types.ObjectId; earnings: number; gross: number; commission: number }>([
    { $match: { paymentStatus: "paid" } },
    { $project: { vendor: 1, vendorEarnings: 1, total: 1, commission: 1 } },
    { $unionWith: { coll: "bookings", pipeline: [{ $match: { paymentStatus: "paid" } }, { $project: { vendor: 1, vendorEarnings: 1, total: 1, commission: 1 } }] } },
    { $group: { _id: "$vendor", earnings: { $sum: "$vendorEarnings" }, gross: { $sum: "$total" }, commission: { $sum: "$commission" } } },
    { $sort: { gross: -1 } },
    { $limit: 10 },
  ]);
  const vendors = await VendorProfile.find({ _id: { $in: topVendors.map((t) => t._id) } }).select("storeName slug").lean();
  const vmap = new Map(vendors.map((v) => [v._id.toString(), v]));
  return {
    gmv: Math.round((oSum.total + bSum.total) * 100) / 100,
    commission: Math.round((oSum.commission + bSum.commission) * 100) / 100,
    vendorEarnings: Math.round((oSum.earnings + bSum.earnings) * 100) / 100,
    byStatus: Object.fromEntries(byStatus.map((s) => [s._id, { n: s.n, amount: Math.round(s.amount * 100) / 100 }])) as Record<string, { n: number; amount: number }>,
    byProvider: byProvider.map((p) => ({ provider: p._id, n: p.n, amount: Math.round(p.amount * 100) / 100 })),
    series,
    vendorEarningsTable: topVendors.map((t) => ({
      vendorId: t._id.toString(),
      storeName: vmap.get(t._id.toString())?.storeName ?? "Unknown vendor",
      slug: vmap.get(t._id.toString())?.slug ?? "",
      gross: Math.round(t.gross * 100) / 100,
      commission: Math.round(t.commission * 100) / 100,
      earnings: Math.round(t.earnings * 100) / 100,
    })),
  };
}
