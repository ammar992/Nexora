/**
 * Loads a demo catalog (categories, vendors, products, services, a few completed
 * orders/bookings with verified reviews) so the marketplace isn't empty on first run.
 *   npm run seed:demo            → add demo data (idempotent)
 *   npm run seed:demo -- --reset → remove demo data (categories are kept)
 * Images are uploaded to your Cloudinary folder when CLOUDINARY_* is configured.
 * Demo accounts use the @demo.nexora.local domain and are safe to delete.
 */
import "./loadEnv";
import crypto from "node:crypto";
import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary";
import { User } from "../src/server/models/User";
import { VendorProfile } from "../src/server/models/VendorProfile";
import { Category } from "../src/server/models/Category";
import { Listing } from "../src/server/models/Listing";
import { Order } from "../src/server/models/Order";
import { Booking } from "../src/server/models/Booking";
import { Payment } from "../src/server/models/Payment";
import { Review } from "../src/server/models/Review";
import { PlatformSettings } from "../src/server/models/PlatformSettings";
import { hashPassword } from "../src/server/auth/password";

const DOMAIN = "demo.nexora.local";
const U = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1400&h=1400&q=80`;

const CATEGORIES = [
  { name: "Home & Ceramics", slug: "home-ceramics", icon: "Sofa", type: "product", description: "Hand-thrown pottery, vessels and objects for the home.", image: U("1601135183537-10c09f98902a") },
  { name: "Bags & Leather", slug: "bags-leather", icon: "Gem", type: "product", description: "Full-grain leather goods cut and stitched in small runs.", image: U("1760624294582-5341f33f9fa4") },
  { name: "Audio & Tech", slug: "audio-tech", icon: "Headphones", type: "product", description: "Considered gear from independent makers and refurbishers." },
  { name: "Art & Prints", slug: "art-prints", icon: "Palette", type: "product", description: "Original paintings, textile work and limited prints." },
  { name: "Wellness", slug: "wellness", icon: "Flower2", type: "both", description: "Rituals, treatments and small-batch skincare." },
  { name: "Photography", slug: "photography", icon: "Camera", type: "service", description: "Portrait, product and event photographers." },
  { name: "Home Services", slug: "home-services", icon: "Home", type: "service", description: "Styling, deep cleans and help around the house." },
  { name: "Food & Classes", slug: "food-classes", icon: "ChefHat", type: "service", description: "Cooking classes, tastings and hands-on workshops." },
];

const WEEKDAYS = [1, 2, 3, 4, 5];
const WEEK_AND_SAT = [2, 3, 4, 5, 6];

const VENDORS = [
  {
    key: "tidewater", name: "Mara Okafor", storeName: "Tidewater Studio", city: "Lisbon", country: "Portugal",
    tagline: "Stoneware thrown by hand on the Tagus.", description: "A two-person pottery studio making functional stoneware in small glaze batches. Every piece is thrown, trimmed and glazed by hand, then fired twice.",
    listings: [
      { type: "product", category: "home-ceramics", title: "Tidewater Stoneware Vase", price: 84, stock: 12, shippingFee: 9, images: ["1603507675916-42cfaa47bc5d", "1602542212259-720d433f8417"], summary: "Glossy cobalt glaze over speckled stoneware.", tags: ["vase", "stoneware", "blue"], highlights: ["Hand-thrown, 24 cm tall", "Watertight, food-safe glaze", "Each glaze run is slightly different"] },
      { type: "product", category: "home-ceramics", title: "Hand-Thrown Serving Bowl", price: 58, stock: 20, shippingFee: 9, images: ["1601135183537-10c09f98902a"], summary: "A wide, shallow bowl for salads and shared plates.", tags: ["bowl", "tableware"], highlights: ["28 cm across", "Dishwasher safe", "Matte white liner glaze"] },
      { type: "product", category: "home-ceramics", title: "Bone Planter with Saucer", price: 46, compareAtPrice: 54, stock: 3, shippingFee: 9, images: ["1610635966675-f6fcaaf9b833"], summary: "Unglazed exterior, glazed interior, drainage hole.", tags: ["planter", "minimal"], highlights: ["Fits a 12 cm nursery pot", "Includes matching saucer"] },
    ],
  },
  {
    key: "saddle", name: "Imran Qadir", storeName: "Saddle & Thread", city: "Sialkot", country: "Pakistan",
    tagline: "Full-grain leather, saddle-stitched.", description: "Third-generation leatherworkers producing bags in vegetable-tanned hides. We cut, edge and stitch every bag in our own workshop.",
    listings: [
      { type: "product", category: "bags-leather", title: "Saddle Tote in Tan", price: 189, stock: 8, shippingFee: 15, images: ["1691480150204-66dd1eb77391", "1691480250099-a63081ecfcb8"], summary: "A structured everyday tote that softens with use.", tags: ["tote", "leather", "tan"], highlights: ["Vegetable-tanned full-grain hide", "Fits a 14″ laptop", "Lifetime stitching repairs"] },
      { type: "product", category: "bags-leather", title: "Black Crossbody Carry", price: 129, stock: 15, shippingFee: 12, images: ["1709898838174-83c3e155654c"], summary: "Slim crossbody with an adjustable strap.", tags: ["crossbody", "black"], highlights: ["Two interior pockets", "Solid brass hardware"] },
      { type: "product", category: "bags-leather", title: "Market Tote Trio", price: 240, compareAtPrice: 285, stock: 4, shippingFee: 15, images: ["1760624294582-5341f33f9fa4"], summary: "Three totes in cognac, olive and black.", tags: ["tote", "bundle"], highlights: ["Bundle of three sizes", "Unlined, raw-edge finish"] },
    ],
  },
  {
    key: "lumen", name: "Sofia Lindqvist", storeName: "Lumen Portraits", city: "Lisbon", country: "Portugal",
    tagline: "Natural-light portraits, unhurried.", description: "Portrait and personal branding photography in natural light. Sessions are relaxed and guided, and you get a private gallery within a week.",
    listings: [
      { type: "service", category: "photography", title: "Natural-Light Portrait Session", price: 180, priceUnit: "session", durationMinutes: 90, images: ["1603574670812-d24560880210", "1495580621852-5de0cc907d2f"], summary: "90 minutes on location with 25 edited images.", tags: ["portrait", "headshot", "branding"], highlights: ["25 hand-edited images", "Private online gallery", "Outfit and location guidance"], availability: { days: WEEK_AND_SAT, startTime: "09:00", endTime: "17:00", slotMinutes: 120, capacityPerSlot: 1 } },
      { type: "service", category: "photography", title: "Product Photography Half-Day", price: 420, priceUnit: "session", durationMinutes: 240, images: ["1623577284502-d65cdc6ba0b6"], summary: "Studio product shots for your shop or catalogue.", tags: ["product", "studio", "ecommerce"], highlights: ["Up to 20 products", "White and styled backdrops", "Web-ready exports"], availability: { days: WEEKDAYS, startTime: "09:00", endTime: "13:00", slotMinutes: 240, capacityPerSlot: 1 } },
    ],
  },
  {
    key: "hearth", name: "Daniel Mensah", storeName: "Hearth & Table", city: "London", country: "United Kingdom",
    tagline: "Cook together. Eat well.", description: "Small-group cooking classes and private chef evenings. We source from local growers and teach techniques you'll actually use at home.",
    listings: [
      { type: "service", category: "food-classes", title: "Seasonal Cooking Class", price: 75, priceUnit: "person", durationMinutes: 180, images: ["1646817120755-885025269892", "1733176552053-949b0b045a49"], summary: "Three hours, four dishes, one long table.", tags: ["cooking", "class", "group"], highlights: ["Groups of up to 8", "All ingredients included", "Recipe cards to take home"], availability: { days: [3, 4, 5, 6], startTime: "11:00", endTime: "20:00", slotMinutes: 180, capacityPerSlot: 8 } },
      { type: "service", category: "food-classes", title: "Live-Fire Grill Masterclass", price: 95, priceUnit: "person", durationMinutes: 150, images: ["1784013948622-ca65da5c574f", "1581340387417-e188200eb0f0"], summary: "Fish, vegetables and flatbreads over open flame.", tags: ["grill", "bbq", "outdoor"], highlights: ["Hands-on at the grill", "Groups of up to 6"], availability: { days: [5, 6], startTime: "12:00", endTime: "18:00", slotMinutes: 150, capacityPerSlot: 6 } },
    ],
  },
  {
    key: "quiet", name: "Ayesha Rahman", storeName: "Quiet Room", city: "London", country: "United Kingdom",
    tagline: "Rituals for slowing down.", description: "A wellness studio offering scalp treatments and restorative sessions, plus a small line of botanical oils we blend in-house.",
    listings: [
      { type: "service", category: "wellness", title: "Restorative Scalp Ritual", price: 65, priceUnit: "session", durationMinutes: 60, images: ["1767953829433-1e405b6889de", "1595284842888-519573d8fb7b"], summary: "An hour of massage, steam and botanical oil.", tags: ["massage", "scalp", "relax"], highlights: ["Warm oil and steam", "Calm private room"], availability: { days: WEEK_AND_SAT, startTime: "10:00", endTime: "19:00", slotMinutes: 60, capacityPerSlot: 2 } },
      { type: "product", category: "wellness", title: "Botanical Hair Oil, 50 ml", price: 32, stock: 40, shippingFee: 5, images: ["1662467191671-1efa5752e960"], summary: "Cold-pressed oils with rosemary and cedar.", tags: ["oil", "haircare", "botanical"], highlights: ["Blended in small batches", "Glass dropper bottle"] },
    ],
  },
  {
    key: "nook", name: "Leo Hartmann", storeName: "Nook Interiors", city: "Berlin", country: "Germany",
    tagline: "Calm rooms, made to be lived in.", description: "Interior styling and home refresh services. We work with what you already own, then fill the gaps with pieces from makers we trust.",
    listings: [
      { type: "service", category: "home-services", title: "Interior Styling Consultation", price: 140, priceUnit: "session", durationMinutes: 120, images: ["1788396408394-b8e46d19272c", "1749705319317-f9a2bf24fe3d"], summary: "A two-hour visit with a written plan afterwards.", tags: ["interior", "styling", "consultation"], highlights: ["Room-by-room plan", "Shopping list with links"], availability: { days: WEEKDAYS, startTime: "09:00", endTime: "17:00", slotMinutes: 120, capacityPerSlot: 1 } },
      { type: "service", category: "home-services", title: "Home Refresh & Deep Clean", price: 38, priceUnit: "hour", durationMinutes: 60, images: ["1776673449578-69107b0b9cb1", "1759722667581-16853f1ddcd0"], summary: "Thorough top-to-bottom cleaning, eco products.", tags: ["cleaning", "home"], highlights: ["Eco-certified products", "Insured team"], availability: { days: WEEK_AND_SAT, startTime: "08:00", endTime: "18:00", slotMinutes: 60, capacityPerSlot: 3 } },
    ],
  },
  {
    key: "signal", name: "Kenji Arai", storeName: "Signal Audio", city: "Berlin", country: "Germany",
    tagline: "Restored and hand-tuned headphones.", description: "We restore classic studio headphones and build a few of our own. Every pair is tested, re-padded and tuned before it ships.",
    listings: [
      { type: "product", category: "audio-tech", title: "Over-Ear Studio Headphones", price: 219, compareAtPrice: 259, stock: 6, shippingFee: 10, images: ["1638803782506-d975a6809f43", "1723961617032-ef69c454cb31"], summary: "Closed-back, detachable cable, new protein pads.", tags: ["headphones", "studio", "audio"], highlights: ["Tested and tuned by hand", "12-month warranty"] },
      { type: "product", category: "audio-tech", title: "Wired Monitor Headphones", price: 139, stock: 10, shippingFee: 10, images: ["1615375834706-98afda0d534f"], summary: "Neutral, honest sound for mixing and listening.", tags: ["headphones", "wired"], highlights: ["3 m coiled cable", "Replaceable ear pads"] },
    ],
  },
  {
    key: "atelier", name: "Nadia Haddad", storeName: "Atelier Nadia", city: "Marseille", country: "France",
    tagline: "Original paintings and textile work.", description: "Abstract paintings on canvas and woven textile pieces, made in a shared studio by the sea. Each work ships with a signed certificate.",
    listings: [
      { type: "product", category: "art-prints", title: "Original Abstract on Canvas", price: 640, stock: 1, shippingFee: 35, images: ["1531489956451-20957fab52f2", "1681235014294-588fea095706"], summary: "Acrylic and charcoal, 80 × 80 cm, one of one.", tags: ["painting", "original", "abstract"], highlights: ["Signed certificate", "Ready to hang"] },
      { type: "product", category: "art-prints", title: "Woven Thread Study", price: 210, stock: 2, shippingFee: 20, images: ["1655458439710-df7caabc7cc1"], summary: "A small textile piece in rust and ochre.", tags: ["textile", "weaving"], highlights: ["40 × 40 cm", "Hand-woven wool and cotton"] },
    ],
  },
];

const REVIEWS = [
  { rating: 5, title: "Even better in person", comment: "The glaze has so much depth, it changes colour through the day. Packed beautifully and arrived in four days." },
  { rating: 5, title: "Felt completely at ease", comment: "I hate being photographed and Sofia made it easy. The gallery came back in five days and I've used the photos everywhere." },
  { rating: 4, title: "Great class, long table", comment: "Learned more about knife work in three hours than in years of watching videos. Would have loved one more dessert." },
  { rating: 5, title: "Built to last", comment: "You can smell the leather the moment you open the box. The stitching is perfect and it's already softening up." },
  { rating: 5, title: "An hour I didn't want to end", comment: "Calm room, warm oil, and no upsell at the end. I've booked again for next month." },
];

let cloudReady = false;
function setupCloudinary() {
  const { CLOUDINARY_CLOUD_NAME: c, CLOUDINARY_API_KEY: k, CLOUDINARY_API_SECRET: s } = process.env;
  if (c && k && s) {
    cloudinary.config({ cloud_name: c, api_key: k, api_secret: s, secure: true });
    cloudReady = true;
  }
}

async function image(id: string, alt: string, folder: string) {
  const url = U(id);
  if (!cloudReady) return { url, publicId: "", alt };
  try {
    const res = await cloudinary.uploader.upload(url, {
      folder: `${process.env.CLOUDINARY_FOLDER || "nexora"}/${folder}`,
      public_id: id.replace(/[^a-z0-9-]/gi, ""),
      overwrite: false,
      transformation: [{ width: 1600, height: 1600, crop: "limit", quality: "auto", fetch_format: "auto" }],
    });
    return { url: res.secure_url, publicId: res.public_id, alt };
  } catch (err) {
    console.warn(`  ! Cloudinary upload failed for ${id}, using source URL (${(err as Error).message})`);
    return { url, publicId: "", alt };
  }
}

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const ref = (p: string) => `${p}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000);

async function reset() {
  const users = await User.find({ email: new RegExp(`@${DOMAIN.replace(/\./g, "\\.")}$`) }).select("_id").lean();
  const ids = users.map((u) => u._id);
  const vendors = await VendorProfile.find({ user: { $in: ids } }).select("_id").lean();
  const vids = vendors.map((v) => v._id);
  await Promise.all([
    Listing.deleteMany({ vendor: { $in: vids } }),
    Order.deleteMany({ $or: [{ vendor: { $in: vids } }, { customer: { $in: ids } }] }),
    Booking.deleteMany({ $or: [{ vendor: { $in: vids } }, { customer: { $in: ids } }] }),
    Payment.deleteMany({ customer: { $in: ids } }),
    Review.deleteMany({ $or: [{ vendor: { $in: vids } }, { author: { $in: ids } }] }),
    VendorProfile.deleteMany({ _id: { $in: vids } }),
    User.deleteMany({ _id: { $in: ids } }),
  ]);
  console.log(`✔ Removed ${users.length} demo users, ${vendors.length} vendors and their data.`);
}

async function main() {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is not set.");
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
  await Promise.all([User, VendorProfile, Category, Listing, Order, Booking, Payment, Review].map((m) => m.syncIndexes()));
  if (process.argv.includes("--reset")) {
    await reset();
    return;
  }
  setupCloudinary();
  console.log(cloudReady ? "ℹ Uploading images to Cloudinary…" : "ℹ Cloudinary not configured, using source image URLs.");

  const settings = await PlatformSettings.findOneAndUpdate({ key: "global" }, { $setOnInsert: { key: "global" } }, { upsert: true, returnDocument: "after" }).lean();
  const rate = settings?.commissionRate ?? 10;
  const password = process.env.DEMO_PASSWORD || "DemoPass123";
  const passwordHash = await hashPassword(password);

  // Categories
  const catBySlug = new Map<string, mongoose.Types.ObjectId>();
  for (const [i, c] of CATEGORIES.entries()) {
    let doc = await Category.findOne({ slug: c.slug });
    if (!doc) {
      const img = c.image ? (await image(c.image.split("photo-")[1].split("?")[0], c.name, "categories")).url : "";
      doc = await Category.create({ ...c, type: c.type as "product" | "service" | "both", image: img, sortOrder: i, isActive: true });
      console.log(`  + category ${c.name}`);
    }
    catBySlug.set(c.slug, doc._id);
  }

  // Customer used for the sample orders and reviews
  const customerEmail = `customer@${DOMAIN}`;
  let customer = await User.findOne({ email: customerEmail });
  if (!customer) customer = await User.create({ name: "Jordan Ellis", email: customerEmail, passwordHash, role: "customer", emailVerified: true });

  let reviewIdx = 0;
  for (const v of VENDORS) {
    const email = `${v.key}@${DOMAIN}`;
    let user = await User.findOne({ email });
    if (!user) user = await User.create({ name: v.name, email, passwordHash, role: "vendor", emailVerified: true });
    let vendor = await VendorProfile.findOne({ user: user._id });
    if (!vendor) {
      vendor = await VendorProfile.create({
        user: user._id, storeName: v.storeName, slug: slug(v.storeName), tagline: v.tagline, description: v.description,
        location: { city: v.city, country: v.country }, contactEmail: email, status: "approved", approvedAt: new Date(), featured: ["tidewater", "lumen", "saddle"].includes(v.key),
      });
      console.log(`  + vendor ${v.storeName}`);
    }

    for (const l of v.listings) {
      const lslug = slug(l.title);
      if (await Listing.exists({ slug: lslug })) continue;
      const images = [];
      for (const id of l.images) images.push(await image(id, l.title, "listings"));
      const isService = l.type === "service";
      const listing = await Listing.create({
        vendor: vendor._id, owner: user._id, category: catBySlug.get(l.category), type: l.type as "product" | "service", title: l.title, slug: lslug,
        summary: l.summary, description: `${l.summary} ${v.description}\n\nMade by ${v.storeName} in ${v.city}. Questions before you ${isService ? "book" : "order"}? Use “Ask the vendor” on this page and they'll reply by email.`,
        images, price: l.price, compareAtPrice: "compareAtPrice" in l ? l.compareAtPrice : undefined,
        priceUnit: (isService ? ("priceUnit" in l ? l.priceUnit : "session") : "item") as "item" | "session" | "hour" | "day" | "person", currency: settings?.currency ?? "USD",
        stock: isService ? 0 : ("stock" in l ? l.stock : 0), shippingFee: "shippingFee" in l ? l.shippingFee : 0,
        durationMinutes: "durationMinutes" in l ? l.durationMinutes : undefined,
        availability: isService && "availability" in l ? { ...l.availability, blockedDates: [], leadTimeHours: 2, maxAdvanceDays: 60 } : undefined,
        location: { city: v.city, country: v.country, remote: false }, tags: l.tags, highlights: l.highlights,
        status: "approved", featured: reviewIdx % 2 === 0, views: 40 + Math.floor(Math.random() * 400),
      });
      console.log(`    + ${l.title}`);

      // A completed purchase + verified review for the first listing of each vendor.
      if (l === v.listings[0] && reviewIdx < REVIEWS.length + 3) {
        const r = REVIEWS[reviewIdx % REVIEWS.length];
        const total = l.price;
        const commission = Math.round(total * rate) / 100;
        const paymentId = new mongoose.Types.ObjectId();
        if (isService) {
          const b = await Booking.create({
            reference: ref("BK"), customer: customer._id, vendor: vendor._id, listing: listing._id,
            listingSnapshot: { title: l.title, image: images[0]?.url ?? "", price: l.price, priceUnit: listing.priceUnit, durationMinutes: listing.durationMinutes ?? 60 },
            date: daysAgo(12).toISOString().slice(0, 10), timeSlot: "10:00", guests: 1, contact: { name: customer.name, email: customer.email },
            subtotal: total, commissionRate: rate, commission, vendorEarnings: total - commission, total, currency: listing.currency,
            status: "completed", paymentStatus: "paid", paymentMethod: "manual", payment: paymentId,
            statusHistory: [{ status: "pending", note: "Booking requested" }, { status: "confirmed" }, { status: "completed" }], createdAt: daysAgo(20),
          });
          await Payment.create({ _id: paymentId, reference: ref("PM"), customer: customer._id, kind: "booking", booking: b._id, provider: "manual", amount: total, commission, currency: listing.currency, status: "paid", paidAt: daysAgo(12), createdAt: daysAgo(20) });
        } else {
          const o = await Order.create({
            reference: ref("NX"), checkoutGroup: ref("CG"), customer: customer._id, vendor: vendor._id,
            items: [{ listing: listing._id, title: l.title, image: images[0]?.url ?? "", unitPrice: l.price, quantity: 1, lineTotal: l.price }],
            shippingAddress: { name: customer.name, phone: "+44 20 0000 0000", line1: "12 Example Street", city: "London", postalCode: "N1 1AA", country: "United Kingdom" },
            subtotal: total, shippingFee: 0, total, commissionRate: rate, commission, vendorEarnings: total - commission, currency: listing.currency,
            status: "delivered", paymentStatus: "paid", paymentMethod: "manual", payment: paymentId, stockRestored: false,
            statusHistory: [{ status: "processing", note: "Order placed" }, { status: "shipped" }, { status: "delivered" }], createdAt: daysAgo(25),
          });
          await Payment.create({ _id: paymentId, reference: ref("PM"), customer: customer._id, kind: "order", orders: [o._id], provider: "manual", amount: total, commission, currency: listing.currency, status: "paid", paidAt: daysAgo(18), createdAt: daysAgo(25) });
          await Listing.updateOne({ _id: listing._id }, { $inc: { salesCount: 1 } });
        }
        await VendorProfile.updateOne({ _id: vendor._id }, { $inc: { totalSales: total } });
        await Review.create({ listing: listing._id, vendor: vendor._id, author: customer._id, rating: r.rating, title: r.title, comment: r.comment, verified: true });
        const [agg] = await Review.aggregate([{ $match: { listing: listing._id } }, { $group: { _id: null, a: { $avg: "$rating" }, n: { $sum: 1 } } }]);
        await Listing.updateOne({ _id: listing._id }, { $set: { rating: agg.a, reviewCount: agg.n } });
        const [vagg] = await Review.aggregate([{ $match: { vendor: vendor._id } }, { $group: { _id: null, a: { $avg: "$rating" }, n: { $sum: 1 } } }]);
        await VendorProfile.updateOne({ _id: vendor._id }, { $set: { rating: vagg.a, reviewCount: vagg.n } });
      }
      reviewIdx++;
    }
  }
  console.log(`\n✔ Demo data ready. Demo accounts (password: ${password}):`);
  console.log(`   customer@${DOMAIN}`);
  for (const v of VENDORS) console.log(`   ${v.key}@${DOMAIN}  (${v.storeName})`);
}

main()
  .catch((err) => {
    console.error("✖ Demo seed failed:", err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
