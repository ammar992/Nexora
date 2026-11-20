/**
 * End-to-end API test against a running server (npm run dev, then npm run test:e2e).
 * Exercises the real flows: auth, verification, cart checkout, fulfilment, reviews,
 * bookings with double-booking protection, vendor onboarding, moderation and RBAC.
 * Requires demo data (npm run seed:demo) and the admin account (npm run seed:admin).
 * Everything it creates uses the @e2e.nexora.local domain and is removed at the end.
 */
import "./loadEnv";
import crypto from "node:crypto";
import mongoose from "mongoose";
import { User } from "../src/server/models/User";
import { AuthToken } from "../src/server/models/AuthToken";
import { Listing } from "../src/server/models/Listing";
import { Order } from "../src/server/models/Order";
import { Booking } from "../src/server/models/Booking";
import { Payment } from "../src/server/models/Payment";
import { Review } from "../src/server/models/Review";
import { VendorProfile } from "../src/server/models/VendorProfile";
import { Notification } from "../src/server/models/Notification";
import { RateLimit } from "../src/server/models/RateLimit";
import { recomputeRatingsStandalone } from "./ratings";

const BASE = process.env.E2E_BASE_URL || "http://localhost:3000";
const DOMAIN = "e2e.nexora.local";
const run = Date.now().toString(36);
let passed = 0;
let failed = 0;

class Client {
  cookie = "";
  async req<T = unknown>(method: string, path: string, body?: unknown): Promise<{ status: number; data: T; error?: string }> {
    const res = await fetch(BASE + "/api" + path, {
      method,
      headers: { "Content-Type": "application/json", cookie: this.cookie, "x-forwarded-for": `10.0.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}` },
      body: body === undefined ? undefined : JSON.stringify(body),
      redirect: "manual",
    });
    const set = res.headers.getSetCookie?.() ?? [];
    for (const c of set) {
      const [pair] = c.split(";");
      if (pair.startsWith("nx_session=")) this.cookie = pair.endsWith("=") ? "" : pair;
    }
    const json = (await res.json().catch(() => ({}))) as { data?: T; error?: string };
    return { status: res.status, data: json.data as T, error: json.error };
  }
  get<T>(p: string) { return this.req<T>("GET", p); }
  post<T>(p: string, b?: unknown) { return this.req<T>("POST", p, b ?? {}); }
  patch<T>(p: string, b?: unknown) { return this.req<T>("PATCH", p, b ?? {}); }
  put<T>(p: string, b?: unknown) { return this.req<T>("PUT", p, b ?? {}); }
}

function check(name: string, cond: unknown, detail?: unknown) {
  if (cond) {
    passed++;
    console.log(`  \x1b[32m✔\x1b[0m ${name}`);
  } else {
    failed++;
    console.log(`  \x1b[31m✖ ${name}\x1b[0m`, detail ?? "");
  }
}

async function verifyEmail(c: Client, userId: mongoose.Types.ObjectId) {
  const token = crypto.randomBytes(32).toString("base64url");
  await AuthToken.create({ user: userId, purpose: "verify_email", tokenHash: crypto.createHash("sha256").update(token).digest("hex"), expiresAt: new Date(Date.now() + 3600_000) });
  return c.post("/auth/verify-email", { token });
}

async function register(name: string) {
  const c = new Client();
  const email = `${name.toLowerCase()}-${run}@${DOMAIN}`;
  const r = await c.post<{ id: string }>("/auth/register", { name, email, password: "Passw0rd!x", accountType: "customer" });
  return { c, email, r, id: r.data?.id };
}

function nextBookable(days: number[], lead: number) {
  const d = new Date();
  d.setDate(d.getDate() + Math.ceil(lead / 24) + 1);
  const key = (x: Date) => `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
  for (let i = 0; i < 30; i++, d.setDate(d.getDate() + 1)) if (days.includes(d.getDay())) return key(d);
  throw new Error("no bookable day");
}

async function main() {
  await mongoose.connect(process.env.MONGODB_URI!);
  console.log(`\nE2E against ${BASE}\n`);

  console.log("Auth");
  const alice = await register("Alice");
  check("register returns 201 and a session cookie", alice.r.status === 201 && alice.c.cookie, alice.r);
  const dup = await new Client().post("/auth/register", { name: "Dup", email: alice.email, password: "Passw0rd!x" });
  check("duplicate email is rejected with 409", dup.status === 409, dup);
  const weak = await new Client().post("/auth/register", { name: "Weak", email: `weak-${run}@${DOMAIN}`, password: "short" });
  check("weak password fails validation (422)", weak.status === 422, weak);
  const me = await alice.c.get<{ user: { email: string; emailVerified: boolean } }>("/auth/me");
  check("/auth/me returns the signed-in user", me.data?.user?.email === alice.email);

  const vase = await Listing.findOne({ slug: "tidewater-stoneware-vase" }).lean();
  if (!vase) throw new Error("Demo data missing — run npm run seed:demo");
  const address = { name: "Alice Test", phone: "+1 555 0100", line1: "1 Test Street", city: "Lisbon", postalCode: "1000-001", country: "Portugal" };
  const unverified = await alice.c.post("/checkout/cart", { items: [{ listingId: vase._id.toString(), quantity: 1 }], shippingAddress: address, provider: "manual" });
  check("checkout is blocked until email is verified (403)", unverified.status === 403, unverified);
  const v = await verifyEmail(alice.c, new mongoose.Types.ObjectId(alice.id));
  check("email verification token is accepted", v.status === 200, v);
  const reuse = await alice.c.post("/auth/verify-email", { token: "x".repeat(40) });
  check("invalid verification token is rejected", reuse.status === 400);

  console.log("\nCart checkout");
  const quote = await alice.c.post<{ items: { listingId: string; available: boolean }[] }>("/cart/quote", { ids: [vase._id.toString()] });
  check("cart quote returns live availability", quote.data?.items?.[0]?.available === true, quote);
  const stockBefore = vase.stock;
  const tooMany = await alice.c.post("/checkout/cart", { items: [{ listingId: vase._id.toString(), quantity: stockBefore + 5 }], shippingAddress: address, provider: "manual" });
  check("ordering more than stock is refused (409)", tooMany.status === 409, tooMany);
  const co = await alice.c.post<{ redirectUrl: string }>("/checkout/cart", { items: [{ listingId: vase._id.toString(), quantity: 2 }], shippingAddress: address, provider: "manual" });
  check("manual checkout succeeds", co.status === 201 && co.data?.redirectUrl?.includes("/checkout/success"), co);
  const after = await Listing.findById(vase._id).lean();
  check("stock was decremented atomically", after!.stock === stockBefore - 2, { before: stockBefore, after: after!.stock });
  const order = await Order.findOne({ customer: alice.id }).lean();
  check("order created in processing / unpaid", order?.status === "processing" && order?.paymentStatus === "unpaid", order?.status);
  const stripe = await alice.c.post("/checkout/cart", { items: [{ listingId: vase._id.toString(), quantity: 1 }], shippingAddress: address, provider: "stripe" });
  check(process.env.STRIPE_SECRET_KEY ? "stripe checkout returns a redirect" : "stripe is refused when not configured (400)", process.env.STRIPE_SECRET_KEY ? stripe.status === 201 : stripe.status === 400, stripe);

  console.log("\nVendor fulfilment");
  const vendor = new Client();
  const vl = await vendor.post<{ home: string }>("/auth/login", { email: "tidewater@demo.nexora.local", password: process.env.DEMO_PASSWORD || "DemoPass123" });
  check("vendor can sign in", vl.status === 200 && vl.data?.home === "/vendor", vl);
  const early = await alice.c.post(`/listings/${vase._id}/reviews`, { rating: 5, comment: "Lovely glaze and colour." });
  check("review before delivery is refused (403)", early.status === 403, early);
  const ship = await vendor.patch(`/orders/${order!._id}/status`, { status: "shipped", trackingNumber: "TRACK123" });
  check("vendor marks order shipped", ship.status === 200, ship);
  const bad = await vendor.patch(`/orders/${order!._id}/status`, { status: "processing" });
  check("invalid status transition is refused (409)", bad.status === 409, bad);
  const custCancel = await alice.c.patch(`/orders/${order!._id}/status`, { status: "cancelled" });
  check("customer can't cancel after shipping (403)", custCancel.status === 403, custCancel);
  const deliver = await vendor.patch(`/orders/${order!._id}/status`, { status: "delivered" });
  check("vendor marks order delivered", deliver.status === 200, deliver);
  const paid = await vendor.post(`/orders/${order!._id}/payment`);
  check("vendor records cash payment", paid.status === 200, paid);
  const o2 = await Order.findById(order!._id).lean();
  check("order is delivered + paid with tracking", o2?.status === "delivered" && o2?.paymentStatus === "paid" && o2?.trackingNumber === "TRACK123", o2);
  const other = await new Client().patch(`/orders/${order!._id}/status`, { status: "cancelled" });
  check("anonymous status change is refused (401)", other.status === 401);

  console.log("\nReviews");
  const rv = await alice.c.post(`/listings/${vase._id}/reviews`, { rating: 4, title: "Beautiful", comment: "Lovely glaze, arrived well packed." });
  check("verified buyer can review (201)", rv.status === 201, rv);
  const l2 = await Listing.findById(vase._id).lean();
  check("listing rating recomputed", l2!.reviewCount >= 2, { rating: l2!.rating, count: l2!.reviewCount });
  const rv2 = await alice.c.post(`/listings/${vase._id}/reviews`, { rating: 5, comment: "Updating my review after a week." });
  check("second review updates instead of duplicating", rv2.status === 200 && (await Review.countDocuments({ listing: vase._id, author: alice.id })) === 1, rv2);

  console.log("\nBookings");
  const svc = await Listing.findOne({ slug: "natural-light-portrait-session" }).lean();
  const date = nextBookable(svc!.availability!.days, svc!.availability!.leadTimeHours);
  const avail = await alice.c.get<{ slots: { time: string; available: boolean }[] }>(`/listings/${svc!._id}/availability?date=${date}`);
  const slot = avail.data?.slots?.find((s) => s.available)?.time;
  check("availability returns open slots", !!slot, avail);
  const bk = await alice.c.post<{ redirectUrl: string }>("/checkout/booking", { listingId: svc!._id.toString(), date, timeSlot: slot, guests: 1, contact: { name: "Alice", email: alice.email }, provider: "manual" });
  check("booking request succeeds", bk.status === 201, bk);
  const bob = await register("Bob");
  await verifyEmail(bob.c, new mongoose.Types.ObjectId(bob.id));
  const clash = await bob.c.post("/checkout/booking", { listingId: svc!._id.toString(), date, timeSlot: slot, guests: 1, contact: { name: "Bob", email: bob.email }, provider: "manual" });
  check("double booking the same slot is refused (409)", clash.status === 409, clash);
  const closed = await bob.c.post("/checkout/booking", { listingId: svc!._id.toString(), date, timeSlot: "03:00", guests: 1, contact: { name: "Bob", email: bob.email }, provider: "manual" });
  check("a time outside opening hours is refused (409)", closed.status === 409, closed);
  const slotsAfter = await bob.c.get<{ slots: { time: string; available: boolean }[] }>(`/listings/${svc!._id}/availability?date=${date}`);
  check("booked slot now shows as unavailable", slotsAfter.data?.slots?.find((s) => s.time === slot)?.available === false);
  const booking = await Booking.findOne({ customer: alice.id }).lean();
  const lumen = new Client();
  await lumen.post("/auth/login", { email: "lumen@demo.nexora.local", password: process.env.DEMO_PASSWORD || "DemoPass123" });
  const wrongVendor = await vendor.patch(`/bookings/${booking!._id}/status`, { status: "confirmed" });
  check("another vendor can't touch the booking (403)", wrongVendor.status === 403, wrongVendor);
  const conf = await lumen.patch(`/bookings/${booking!._id}/status`, { status: "confirmed" });
  check("vendor confirms booking", conf.status === 200, conf);
  const tooEarly = await lumen.patch(`/bookings/${booking!._id}/status`, { status: "completed" });
  check("booking can't be completed before it starts (409)", tooEarly.status === 409, tooEarly);
  const cancel = await alice.c.patch(`/bookings/${booking!._id}/status`, { status: "cancelled", note: "Plans changed" });
  check("customer cancels booking", cancel.status === 200, cancel);
  const reopen = await bob.c.get<{ slots: { time: string; available: boolean }[] }>(`/listings/${svc!._id}/availability?date=${date}`);
  check("cancelled slot is released", reopen.data?.slots?.find((s) => s.time === slot)?.available === true);

  console.log("\nVendor onboarding & moderation");
  const admin = new Client();
  const al = await admin.post<{ home: string }>("/auth/login", { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD });
  check("admin can sign in", al.status === 200 && al.data?.home === "/admin", al);
  const forbidden = await bob.c.put("/admin/settings", {});
  check("customer can't call admin APIs (403)", forbidden.status === 403, forbidden);
  const apply = await bob.c.post<{ status: string }>("/vendor/apply", { storeName: `E2E Studio ${run}`, description: "We make test fixtures by hand, carefully and slowly.", city: "Porto", country: "Portugal", contactEmail: bob.email });
  check("customer applies to become a vendor", apply.status === 201 && apply.data?.status === "pending", apply);
  const notYet = await bob.c.post("/vendor/listings", {});
  check("pending vendor can't create listings (403)", notYet.status === 403, notYet);
  const profile = await VendorProfile.findOne({ user: bob.id }).lean();
  const approve = await admin.patch(`/admin/vendors/${profile!._id}`, { status: "approved" });
  check("admin approves vendor", approve.status === 200, approve);
  check("user role becomes vendor", (await User.findById(bob.id).lean())?.role === "vendor");
  const cat = await mongoose.connection.db!.collection("categories").findOne({ slug: "home-ceramics" });
  const create = await bob.c.post<{ id: string; status: string }>("/vendor/listings", {
    type: "product", title: `E2E Test Mug ${run}`, description: "A sturdy test mug made only for automated tests.", category: cat!._id.toString(), price: 25, stock: 3, shippingFee: 4,
    location: { city: "Porto", country: "Portugal", remote: false }, images: [{ url: vase.images[0].url, publicId: "", alt: "" }], tags: ["mug"], highlights: [], submit: "pending",
  });
  check("approved vendor creates a listing (pending review)", create.status === 201 && create.data?.status === "pending", create);
  const mugSlug = (await Listing.findById(create.data?.id).lean())?.slug ?? "missing";
  const hidden = await fetch(`${BASE}/explore?q=${encodeURIComponent(`E2E Test Mug ${run}`)}`).then((r) => r.text());
  check("pending listing isn't publicly searchable", !hidden.includes(`/listing/${mugSlug}`));
  const hiddenPage = await fetch(`${BASE}/listing/${mugSlug}`);
  check("pending listing page is 404 for the public", hiddenPage.status === 404, hiddenPage.status);
  const mod = await admin.patch(`/admin/listings/${create.data?.id}`, { status: "approved", featured: true });
  check("admin approves and features the listing", mod.status === 200, mod);
  const shown = await fetch(`${BASE}/explore?q=${encodeURIComponent(`E2E Test Mug ${run}`)}`).then((r) => r.text());
  check("approved listing appears in search", shown.includes(`/listing/${mugSlug}`));
  const deact = await admin.patch(`/admin/users/${alice.id}`, { isActive: false });
  check("admin deactivates a user", deact.status === 200, deact);
  const after2 = await alice.c.get<{ user: unknown }>("/auth/me");
  check("deactivated user's session is revoked", after2.data?.user === null, after2);

  console.log("\nSecurity");
  const attacker = new Client();
  let limited = false;
  for (let i = 0; i < 10; i++) {
    const r = await attacker.post("/auth/login", { email: bob.email, password: "wrong-password-1" });
    if (r.status === 429) limited = true;
  }
  check("repeated failed logins are rate limited (429)", limited);
  const bogus = new Client();
  bogus.cookie = "nx_session=eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ4Iiwicm9sZSI6ImFkbWluIn0.forged";
  const forged = await bogus.get<{ user: unknown }>("/auth/me");
  check("forged session token is ignored", forged.data?.user === null);

  console.log(`\n${passed} passed, ${failed} failed\n`);
}

async function cleanup() {
  const users = await User.find({ email: new RegExp(`@${DOMAIN.replace(/\./g, "\\.")}$`) }).select("_id").lean();
  const ids = users.map((u) => u._id);
  const vendors = await VendorProfile.find({ user: { $in: ids } }).select("_id").lean();
  const vids = vendors.map((v) => v._id);
  const orders = await Order.find({ customer: { $in: ids } }).lean();
  // Put back stock taken by test orders that weren't cancelled.
  for (const o of orders) if (!o.stockRestored) for (const i of o.items) await Listing.updateOne({ _id: i.listing }, { $inc: { stock: i.quantity, salesCount: -i.quantity } });
  const touched = await Review.find({ author: { $in: ids } }).select("listing vendor").lean();
  await Promise.all([
    Order.deleteMany({ customer: { $in: ids } }),
    Booking.deleteMany({ customer: { $in: ids } }),
    Payment.deleteMany({ customer: { $in: ids } }),
    Review.deleteMany({ author: { $in: ids } }),
    Listing.deleteMany({ vendor: { $in: vids } }),
    VendorProfile.deleteMany({ _id: { $in: vids } }),
    Notification.deleteMany({ user: { $in: ids } }),
    AuthToken.deleteMany({ user: { $in: ids } }),
    User.deleteMany({ _id: { $in: ids } }),
    RateLimit.deleteMany({}),
  ]);
  for (const r of touched) await recomputeRatingsStandalone(r.listing, r.vendor);
}

main()
  .catch((err) => {
    failed++;
    console.error("E2E crashed:", err);
  })
  .finally(async () => {
    await cleanup().catch((e) => console.error("cleanup failed", e));
    await mongoose.disconnect();
    process.exitCode = failed ? 1 : 0;
  });
