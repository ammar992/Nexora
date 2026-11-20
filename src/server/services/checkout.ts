import "server-only";
import mongoose from "mongoose";
import { Listing } from "@/server/models/Listing";
import { Order } from "@/server/models/Order";
import { Booking } from "@/server/models/Booking";
import { Payment } from "@/server/models/Payment";
import { VendorProfile } from "@/server/models/VendorProfile";
import { ApiError } from "@/server/http";
import { getProvider } from "@/server/payments";
import { appUrl, requireEmailVerification } from "@/server/env";
import { getSettings } from "./settings";
import { assertSlotAvailable, usedCapacity } from "./availability";
import { reference, round2 } from "./serialize";
import { announceBooking, announceOrders, cancelPayment, releaseStaleHolds } from "./fulfillment";
import type { SessionUser } from "@/server/auth/session";

type CartLine = { listingId: string; quantity: number };
type Address = { name: string; phone?: string; line1: string; line2?: string; city: string; state?: string; postalCode: string; country: string };

function assertCanBuy(user: SessionUser) {
  if (requireEmailVerification() && !user.emailVerified) {
    throw new ApiError(403, "Please verify your email address before checking out. Check your inbox or resend the link from your account.");
  }
}

export type CheckoutResult = { redirectUrl: string };

/**
 * Creates orders (one per vendor) for a cart, reserving stock atomically.
 * With an online provider the orders wait in pending_payment until the webhook confirms;
 * with the offline provider they go straight to the vendor as unpaid.
 */
export async function checkoutCart(user: SessionUser, input: { items: CartLine[]; shippingAddress: Address; provider: string; notes?: string }): Promise<CheckoutResult> {
  assertCanBuy(user);
  const provider = getProvider(input.provider);
  if (!provider) throw new ApiError(400, "That payment method isn't available.");
  await releaseStaleHolds();

  // Merge duplicate lines and validate ids.
  const qtyById = new Map<string, number>();
  for (const line of input.items) {
    if (!mongoose.isValidObjectId(line.listingId)) throw new ApiError(400, "Your cart contains an invalid item.");
    qtyById.set(line.listingId, Math.min(99, (qtyById.get(line.listingId) ?? 0) + line.quantity));
  }
  const listings = await Listing.find({ _id: { $in: [...qtyById.keys()] } }).lean();
  if (listings.length !== qtyById.size) throw new ApiError(409, "Some items in your cart are no longer available. Please review your cart.");
  for (const l of listings) {
    if (l.status !== "approved" || l.type !== "product") throw new ApiError(409, `“${l.title}” is no longer available.`);
    if (l.owner.toString() === user.id) throw new ApiError(409, "You can't buy your own listing.");
  }
  const vendorIds = [...new Set(listings.map((l) => l.vendor.toString()))];
  const activeVendors = await VendorProfile.countDocuments({ _id: { $in: vendorIds }, status: "approved" });
  if (activeVendors !== vendorIds.length) throw new ApiError(409, "One of the sellers in your cart is not accepting orders right now.");

  // Reserve stock atomically; roll back on any shortfall.
  const reserved: { id: mongoose.Types.ObjectId; qty: number }[] = [];
  try {
    for (const l of listings) {
      const qty = qtyById.get(l._id.toString())!;
      const res = await Listing.updateOne({ _id: l._id, stock: { $gte: qty } }, { $inc: { stock: -qty, salesCount: qty } });
      if (res.modifiedCount !== 1) {
        throw new ApiError(409, l.stock > 0 ? `Only ${l.stock} of “${l.title}” left. Please lower the quantity.` : `“${l.title}” just sold out.`);
      }
      reserved.push({ id: l._id, qty });
    }
  } catch (err) {
    await Promise.all(reserved.map((r) => Listing.updateOne({ _id: r.id }, { $inc: { stock: r.qty, salesCount: -r.qty } })));
    throw err;
  }

  const settings = await getSettings();
  const rate = settings.commissionRate ?? 10;
  const currency = settings.currency || "USD";
  const group = reference("CG");
  const online = provider.id !== "manual";

  const byVendor = new Map<string, typeof listings>();
  for (const l of listings) byVendor.set(l.vendor.toString(), [...(byVendor.get(l.vendor.toString()) ?? []), l]);

  const orders = [];
  const payments = [];
  const sharedPaymentId = new mongoose.Types.ObjectId();
  try {
    for (const [vendorId, vendorListings] of byVendor) {
      const items = vendorListings.map((l) => {
        const quantity = qtyById.get(l._id.toString())!;
        return { listing: l._id, title: l.title, image: l.images?.[0]?.url ?? "", unitPrice: l.price, quantity, lineTotal: round2(l.price * quantity) };
      });
      const subtotal = round2(items.reduce((s, i) => s + i.lineTotal, 0));
      const shippingFee = round2(Math.max(...vendorListings.map((l) => l.shippingFee ?? 0), 0));
      const total = round2(subtotal + shippingFee);
      const commission = round2((subtotal * rate) / 100);
      // Offline payments are settled per vendor, so each order gets its own Payment record.
      const paymentId = online ? sharedPaymentId : new mongoose.Types.ObjectId();
      const order = await Order.create({
        reference: reference("NX"),
        checkoutGroup: group,
        customer: user.id,
        vendor: vendorId,
        items,
        shippingAddress: input.shippingAddress,
        subtotal,
        shippingFee,
        total,
        commissionRate: rate,
        commission,
        vendorEarnings: round2(total - commission),
        currency,
        status: online ? "pending_payment" : "processing",
        paymentStatus: "unpaid",
        paymentMethod: provider.id,
        payment: paymentId,
        notes: input.notes ?? "",
        statusHistory: [{ status: online ? "pending_payment" : "processing", note: "Order placed", by: user.id }],
      });
      orders.push(order);
      if (!online) {
        payments.push(
          await Payment.create({ _id: paymentId, reference: reference("PM"), customer: user.id, kind: "order", orders: [order._id], provider: provider.id, amount: total, commission, currency, status: "pending" })
        );
      }
    }

    if (!online) {
      await announceOrders(orders.map((o) => o._id));
      return { redirectUrl: `/checkout/success?group=${group}` };
    }

    const amount = round2(orders.reduce((s, o) => s + o.total, 0));
    const payment = await Payment.create({
      _id: sharedPaymentId,
      reference: reference("PM"),
      customer: user.id,
      kind: "order",
      orders: orders.map((o) => o._id),
      provider: provider.id,
      amount,
      commission: round2(orders.reduce((s, o) => s + o.commission, 0)),
      currency,
      status: "pending",
    });
    const lineItems = orders.flatMap((o) => [
      ...o.items.map((i) => ({ name: i.title, unitAmount: i.unitPrice, quantity: i.quantity, image: i.image || undefined })),
      ...(o.shippingFee > 0 ? [{ name: "Shipping", unitAmount: o.shippingFee, quantity: 1 }] : []),
    ]);
    const result = await provider.createCheckout({
      paymentId: payment._id.toString(),
      reference: payment.reference,
      currency,
      customerEmail: user.email,
      lineItems,
      successUrl: `${appUrl()}/checkout/success?group=${group}`,
      cancelUrl: `${appUrl()}/cart?cancelled=1`,
    });
    if (result.type === "redirect") {
      payment.providerSessionId = result.sessionId;
      await payment.save();
      return { redirectUrl: result.url };
    }
    return { redirectUrl: `/checkout/success?group=${group}` };
  } catch (err) {
    // Nothing has been announced yet, so a failed checkout simply removes its own records
    // and releases the reserved stock.
    await Order.deleteMany({ checkoutGroup: group });
    await Payment.deleteMany({ _id: { $in: [sharedPaymentId, ...payments.map((p) => p._id)] } });
    await Promise.all(reserved.map((r) => Listing.updateOne({ _id: r.id }, { $inc: { stock: r.qty, salesCount: -r.qty } })));
    if (err instanceof ApiError) throw err;
    console.error("[checkout] failed", err);
    throw new ApiError(502, "We couldn't start the payment. Nothing was charged, please try again.");
  }
}

/** Validates the slot, creates the booking and starts payment. */
export async function checkoutBooking(
  user: SessionUser,
  input: { listingId: string; date: string; timeSlot: string; guests: number; contact: { name: string; email: string; phone?: string }; notes?: string; provider: string }
): Promise<CheckoutResult> {
  assertCanBuy(user);
  const provider = getProvider(input.provider);
  if (!provider) throw new ApiError(400, "That payment method isn't available.");
  if (!mongoose.isValidObjectId(input.listingId)) throw new ApiError(404, "That service doesn't exist.");
  await releaseStaleHolds();

  const listing = await Listing.findById(input.listingId).lean();
  if (!listing || listing.status !== "approved" || listing.type !== "service") throw new ApiError(404, "This service isn't available for booking.");
  if (listing.owner.toString() === user.id) throw new ApiError(409, "You can't book your own service.");
  const vendor = await VendorProfile.findById(listing.vendor).select("status").lean();
  if (vendor?.status !== "approved") throw new ApiError(409, "This vendor isn't taking bookings right now.");

  const rules = await assertSlotAvailable(listing, input.date, input.timeSlot, input.guests);
  const settings = await getSettings();
  const rate = settings.commissionRate ?? 10;
  const currency = settings.currency || "USD";
  const subtotal = round2(listing.priceUnit === "person" ? listing.price * input.guests : listing.price);
  const commission = round2((subtotal * rate) / 100);
  const online = provider.id !== "manual";
  const paymentId = new mongoose.Types.ObjectId();

  const booking = await Booking.create({
    reference: reference("BK"),
    customer: user.id,
    vendor: listing.vendor,
    listing: listing._id,
    listingSnapshot: {
      title: listing.title,
      image: listing.images?.[0]?.url ?? "",
      price: listing.price,
      priceUnit: listing.priceUnit,
      durationMinutes: listing.durationMinutes ?? rules.slotMinutes,
    },
    date: input.date,
    timeSlot: input.timeSlot,
    guests: input.guests,
    contact: input.contact,
    notes: input.notes ?? "",
    subtotal,
    commissionRate: rate,
    commission,
    vendorEarnings: round2(subtotal - commission),
    total: subtotal,
    currency,
    status: online ? "pending_payment" : "pending",
    paymentStatus: "unpaid",
    paymentMethod: provider.id,
    payment: paymentId,
    statusHistory: [{ status: online ? "pending_payment" : "pending", note: "Booking requested", by: user.id }],
  });

  // Re-check capacity after insert to close the race between two simultaneous bookings.
  if ((await usedCapacity(listing._id, input.date, input.timeSlot)) > rules.capacityPerSlot) {
    await Booking.deleteOne({ _id: booking._id });
    throw new ApiError(409, "Someone just booked that slot. Please choose another time.");
  }

  const payment = await Payment.create({
    _id: paymentId,
    reference: reference("PM"),
    customer: user.id,
    kind: "booking",
    booking: booking._id,
    provider: provider.id,
    amount: subtotal,
    commission,
    currency,
    status: "pending",
  });

  if (!online) {
    await announceBooking(booking._id);
    return { redirectUrl: `/checkout/success?booking=${booking.reference}` };
  }

  try {
    const result = await provider.createCheckout({
      paymentId: payment._id.toString(),
      reference: payment.reference,
      currency,
      customerEmail: user.email,
      lineItems: [{ name: `${listing.title} · ${input.date} ${input.timeSlot}`, unitAmount: subtotal, quantity: 1, image: listing.images?.[0]?.url }],
      successUrl: `${appUrl()}/checkout/success?booking=${booking.reference}`,
      cancelUrl: `${appUrl()}/listing/${listing.slug}?cancelled=1`,
    });
    if (result.type === "redirect") {
      payment.providerSessionId = result.sessionId;
      await payment.save();
      return { redirectUrl: result.url };
    }
    return { redirectUrl: `/checkout/success?booking=${booking.reference}` };
  } catch (err) {
    await cancelPayment(payment._id, "Payment could not be started");
    console.error("[checkout] booking payment failed", err);
    throw new ApiError(502, "We couldn't start the payment. Nothing was charged, please try again.");
  }
}
