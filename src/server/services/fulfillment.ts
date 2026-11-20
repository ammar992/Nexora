import "server-only";
import type { Types } from "mongoose";
import { Order, type OrderDoc } from "@/server/models/Order";
import { Booking } from "@/server/models/Booking";
import { Payment } from "@/server/models/Payment";
import { Listing } from "@/server/models/Listing";
import { User } from "@/server/models/User";
import { VendorProfile } from "@/server/models/VendorProfile";
import { ApiError } from "@/server/http";
import { getProvider } from "@/server/payments";
import { emails } from "@/server/email/templates";
import { notify } from "./notifications";
import { getSettings } from "./settings";
import { BOOKING_TRANSITIONS, ORDER_TRANSITIONS, PAYMENT_HOLD_MINUTES, STATUS_META } from "@/resources/utils/constant";
import type { SessionUser } from "@/server/auth/session";

type Id = Types.ObjectId | string;

async function vendorUserId(vendorId: Id) {
  const v = await VendorProfile.findById(vendorId).select("user").lean();
  return v?.user ?? null;
}

async function restoreOrderStock(order: Pick<OrderDoc, "_id" | "items">) {
  // Flip the flag first so concurrent cancellations can't restore twice.
  const res = await Order.updateOne({ _id: order._id, stockRestored: false }, { $set: { stockRestored: true } });
  if (res.modifiedCount !== 1) return;
  await Promise.all(order.items.map((i) => Listing.updateOne({ _id: i.listing }, { $inc: { stock: i.quantity, salesCount: -i.quantity } })));
}

/** Cancels unpaid online checkouts whose payment window has passed (releases stock / slots). */
export async function releaseStaleHolds() {
  const cutoff = new Date(Date.now() - (PAYMENT_HOLD_MINUTES + 5) * 60_000);
  const stale = await Payment.find({ status: "pending", provider: { $ne: "manual" }, createdAt: { $lt: cutoff } }).select("_id").limit(50).lean();
  for (const p of stale) await cancelPayment(p._id, "Payment window expired");
}

/** Cancels a pending payment and everything waiting on it. Safe to call more than once. */
export async function cancelPayment(paymentId: Id, reason: string) {
  const payment = await Payment.findOneAndUpdate({ _id: paymentId, status: "pending" }, { $set: { status: "cancelled", failureReason: reason } }, { returnDocument: "after" }).lean();
  if (!payment) return;
  if (payment.kind === "order") {
    const orders = await Order.find({ _id: { $in: payment.orders }, status: { $in: ["pending_payment", "processing"] }, paymentStatus: "unpaid" }).lean();
    for (const o of orders) {
      await Order.updateOne({ _id: o._id }, { $set: { status: "cancelled" }, $push: { statusHistory: { status: "cancelled", note: reason } } });
      await restoreOrderStock(o);
    }
  } else if (payment.booking) {
    await Booking.updateOne(
      { _id: payment.booking, status: { $in: ["pending_payment", "pending"] } },
      { $set: { status: "cancelled", cancellationReason: reason }, $push: { statusHistory: { status: "cancelled", note: reason } } }
    );
  }
}

/** Tells customer and vendors about newly placed orders. */
export async function announceOrders(orderIds: Id[]) {
  const settings = await getSettings();
  const orders = await Order.find({ _id: { $in: orderIds } }).lean();
  if (!orders.length) return;
  const customer = await User.findById(orders[0].customer).select("name").lean();
  for (const o of orders) {
    const paid = o.paymentStatus === "paid";
    await notify(o.customer, {
      type: "order",
      title: `Order ${o.reference} placed`,
      body: `${o.items.length} item${o.items.length > 1 ? "s" : ""} · ${paid ? "paid" : "pay on delivery"}`,
      link: `/account/orders/${o._id}`,
      email: { ...emails.orderConfirmation(settings.siteName, customer?.name ?? "there", { reference: o.reference, total: o.total, currency: o.currency, items: o.items, paid }), force: true },
    });
    const vUser = await vendorUserId(o.vendor);
    if (vUser) {
      await notify(vUser, {
        type: "order",
        title: `New order ${o.reference}`,
        body: o.items.map((i) => `${i.quantity}× ${i.title}`).join(", "),
        link: `/vendor/orders?q=${o.reference}`,
        email: emails.vendorNewSale(settings.siteName, { kind: "order", reference: o.reference, summary: `${customer?.name ?? "A customer"} ordered ${o.items.map((i) => `${i.quantity}× ${i.title}`).join(", ")}.`, total: o.total, currency: o.currency }),
      });
    }
  }
}

export async function announceBooking(bookingId: Id) {
  const settings = await getSettings();
  const b = await Booking.findById(bookingId).lean();
  if (!b) return;
  const customer = await User.findById(b.customer).select("name").lean();
  await notify(b.customer, {
    type: "booking",
    title: b.status === "confirmed" ? `Booking ${b.reference} confirmed` : `Booking ${b.reference} requested`,
    body: `${b.listingSnapshot?.title} · ${b.date} ${b.timeSlot}`,
    link: `/account/bookings/${b._id}`,
    email: {
      ...emails.bookingConfirmation(settings.siteName, customer?.name ?? "there", { reference: b.reference, title: b.listingSnapshot?.title ?? "your booking", date: b.date, timeSlot: b.timeSlot, total: b.total, currency: b.currency, status: b.status }),
      force: true,
    },
  });
  const vUser = await vendorUserId(b.vendor);
  if (vUser) {
    await notify(vUser, {
      type: "booking",
      title: `New booking ${b.reference}`,
      body: `${b.listingSnapshot?.title} on ${b.date} at ${b.timeSlot}${b.status === "pending" ? " · needs your confirmation" : ""}`,
      link: `/vendor/bookings?q=${b.reference}`,
      email: emails.vendorNewSale(settings.siteName, { kind: "booking", reference: b.reference, summary: `${customer?.name ?? "A customer"} booked ${b.listingSnapshot?.title} for ${b.date} at ${b.timeSlot} (${b.guests} guest${b.guests > 1 ? "s" : ""}).`, total: b.total, currency: b.currency }),
    });
  }
}

/**
 * Marks a payment as captured and moves the linked orders/booking forward.
 * Idempotent: a webhook delivered twice only applies once.
 */
export async function markPaymentPaid(paymentId: Id, opts: { providerPaymentId?: string; recordedBy?: string } = {}) {
  const payment = await Payment.findOneAndUpdate(
    { _id: paymentId, status: "pending" },
    { $set: { status: "paid", paidAt: new Date(), providerPaymentId: opts.providerPaymentId ?? "", ...(opts.recordedBy ? { recordedBy: opts.recordedBy } : {}) } },
    { returnDocument: "after" }
  ).lean();
  if (!payment) return false;
  const isOnline = payment.provider !== "manual";
  if (payment.kind === "order") {
    for (const id of payment.orders) {
      const o = await Order.findById(id).lean();
      if (!o) continue;
      const advance = o.status === "pending_payment";
      await Order.updateOne(
        { _id: id },
        { $set: { paymentStatus: "paid", ...(advance ? { status: "processing" } : {}) }, $push: { statusHistory: { status: advance ? "processing" : o.status, note: "Payment received", by: opts.recordedBy } } }
      );
      await VendorProfile.updateOne({ _id: o.vendor }, { $inc: { totalSales: o.total } });
    }
    if (isOnline) await announceOrders(payment.orders);
  } else if (payment.booking) {
    const b = await Booking.findById(payment.booking).lean();
    if (b) {
      const advance = b.status === "pending_payment";
      await Booking.updateOne(
        { _id: b._id },
        { $set: { paymentStatus: "paid", ...(advance ? { status: "confirmed" } : {}) }, $push: { statusHistory: { status: advance ? "confirmed" : b.status, note: "Payment received", by: opts.recordedBy } } }
      );
      await VendorProfile.updateOne({ _id: b.vendor }, { $inc: { totalSales: b.total } });
      if (isOnline) await announceBooking(b._id);
    }
  }
  return true;
}

async function refundAmount(paymentId: Id | undefined | null, amount: number) {
  if (!paymentId) return;
  const payment = await Payment.findById(paymentId);
  if (!payment || payment.status !== "paid") return;
  const provider = getProvider(payment.provider);
  if (payment.provider !== "manual") {
    if (!provider) throw new ApiError(503, "The payment provider for this order is not configured, so it can't be refunded automatically.");
    if (!payment.providerPaymentId) throw new ApiError(409, "This payment has no provider reference yet; try again in a minute.");
    await provider.refund(payment.providerPaymentId, amount < payment.amount ? amount : undefined);
  }
  // A multi-vendor online payment becomes "refunded" once all of its orders are refunded.
  if (payment.kind === "order" && payment.orders.length > 1) {
    const remaining = await Order.countDocuments({ _id: { $in: payment.orders }, paymentStatus: "paid" });
    if (remaining > 1) return;
  }
  payment.status = "refunded";
  payment.refundedAt = new Date();
  await payment.save();
}

type Actor = Pick<SessionUser, "id" | "role" | "vendorId">;

function canManage(actor: Actor, vendorId: Id, customerId: Id) {
  if (actor.role === "admin") return "admin" as const;
  if (actor.vendorId && actor.vendorId === vendorId.toString()) return "vendor" as const;
  if (actor.id === customerId.toString()) return "customer" as const;
  return null;
}

export async function updateOrderStatus(orderId: string, actor: Actor, next: string, opts: { note?: string; trackingNumber?: string } = {}) {
  const order = await Order.findById(orderId).lean();
  if (!order) throw new ApiError(404, "Order not found.");
  const as = canManage(actor, order.vendor, order.customer);
  if (!as) throw new ApiError(403, "You can't change this order.");
  if (as === "customer" && !(next === "cancelled" && ["pending_payment", "processing"].includes(order.status))) {
    throw new ApiError(403, "You can cancel an order until it ships. For anything else, contact the vendor.");
  }
  if (next === "refunded" && as !== "admin") throw new ApiError(403, "Only the marketplace team can issue refunds after delivery.");
  if (!ORDER_TRANSITIONS[order.status]?.includes(next)) {
    throw new ApiError(409, `An order that is ${STATUS_META[order.status]?.label.toLowerCase() ?? order.status} can't be moved to ${STATUS_META[next]?.label.toLowerCase() ?? next}.`);
  }

  let finalStatus = next;
  let paymentStatus = order.paymentStatus;
  if (next === "cancelled" || next === "refunded") {
    if (order.paymentStatus === "paid") {
      await refundAmount(order.payment, order.total);
      finalStatus = "refunded";
      paymentStatus = "refunded";
    } else if (order.payment) {
      await Payment.updateOne({ _id: order.payment, status: "pending", orders: { $size: 1 } }, { $set: { status: "cancelled" } });
    }
    if (order.status !== "delivered") await restoreOrderStock(order);
  }
  await Order.updateOne(
    { _id: order._id },
    {
      $set: { status: finalStatus, paymentStatus, ...(opts.trackingNumber ? { trackingNumber: opts.trackingNumber } : {}) },
      $push: { statusHistory: { status: finalStatus, note: opts.note ?? "", by: actor.id } },
    }
  );

  const settings = await getSettings();
  const customer = await User.findById(order.customer).select("name").lean();
  const label = STATUS_META[finalStatus]?.label ?? finalStatus;
  const note = finalStatus === "shipped" && opts.trackingNumber ? `Tracking number: ${opts.trackingNumber}` : opts.note;
  if (as !== "customer") {
    await notify(order.customer, {
      type: "order",
      title: `Order ${order.reference}: ${label}`,
      body: note ?? "",
      link: `/account/orders/${order._id}`,
      email: emails.statusChange(settings.siteName, customer?.name ?? "there", { kind: "order", reference: order.reference, statusLabel: label, note }),
    });
  } else {
    const vUser = await vendorUserId(order.vendor);
    if (vUser) await notify(vUser, { type: "order", title: `Order ${order.reference} was cancelled by the customer`, link: `/vendor/orders?q=${order.reference}` });
  }
  return finalStatus;
}

export async function updateBookingStatus(bookingId: string, actor: Actor, next: string, opts: { note?: string } = {}) {
  const b = await Booking.findById(bookingId).lean();
  if (!b) throw new ApiError(404, "Booking not found.");
  const as = canManage(actor, b.vendor, b.customer);
  if (!as) throw new ApiError(403, "You can't change this booking.");
  if (as === "customer" && next !== "cancelled") throw new ApiError(403, "You can only cancel your own booking.");
  if (next === "refunded" && as !== "admin") throw new ApiError(403, "Only the marketplace team can issue refunds after a booking is completed.");
  if (!BOOKING_TRANSITIONS[b.status]?.includes(next)) {
    throw new ApiError(409, `A booking that is ${STATUS_META[b.status]?.label.toLowerCase() ?? b.status} can't be moved to ${STATUS_META[next]?.label.toLowerCase() ?? next}.`);
  }
  if (next === "completed" && new Date(`${b.date}T${b.timeSlot}:00`).getTime() > Date.now()) {
    throw new ApiError(409, "You can mark a booking completed once its start time has passed.");
  }

  let finalStatus = next;
  let paymentStatus = b.paymentStatus;
  if (next === "cancelled" || next === "refunded") {
    if (b.paymentStatus === "paid") {
      await refundAmount(b.payment, b.total);
      finalStatus = "refunded";
      paymentStatus = "refunded";
    } else if (b.payment) {
      await Payment.updateOne({ _id: b.payment, status: "pending" }, { $set: { status: "cancelled" } });
    }
  }
  await Booking.updateOne(
    { _id: b._id },
    {
      $set: { status: finalStatus, paymentStatus, ...(finalStatus === "cancelled" || finalStatus === "refunded" ? { cancellationReason: opts.note ?? "" } : {}) },
      $push: { statusHistory: { status: finalStatus, note: opts.note ?? "", by: actor.id } },
    }
  );

  const settings = await getSettings();
  const label = STATUS_META[finalStatus]?.label ?? finalStatus;
  if (as !== "customer") {
    const customer = await User.findById(b.customer).select("name").lean();
    await notify(b.customer, {
      type: "booking",
      title: `Booking ${b.reference}: ${label}`,
      body: opts.note ?? `${b.listingSnapshot?.title} · ${b.date} ${b.timeSlot}`,
      link: `/account/bookings/${b._id}`,
      email: emails.statusChange(settings.siteName, customer?.name ?? "there", { kind: "booking", reference: b.reference, statusLabel: label, note: opts.note }),
    });
  } else {
    const vUser = await vendorUserId(b.vendor);
    if (vUser) await notify(vUser, { type: "booking", title: `Booking ${b.reference} was cancelled by the customer`, body: `${b.date} ${b.timeSlot}`, link: `/vendor/bookings?q=${b.reference}` });
  }
  return finalStatus;
}

/** Vendor/admin records that an offline payment was received. */
export async function recordManualPayment(kind: "order" | "booking", id: string, actor: Actor) {
  const doc = kind === "order" ? await Order.findById(id).lean() : await Booking.findById(id).lean();
  if (!doc) throw new ApiError(404, `${kind === "order" ? "Order" : "Booking"} not found.`);
  const as = canManage(actor, doc.vendor, doc.customer);
  if (as !== "admin" && as !== "vendor") throw new ApiError(403, "Only the vendor or an admin can record payments.");
  if (doc.paymentStatus === "paid") throw new ApiError(409, "This payment is already recorded.");
  if (["cancelled", "refunded"].includes(doc.status)) throw new ApiError(409, "This has been cancelled.");
  const payment = await Payment.findById(doc.payment).lean();
  if (!payment || payment.provider !== "manual") throw new ApiError(409, "Online payments are confirmed automatically by the payment provider.");
  await markPaymentPaid(payment._id, { recordedBy: actor.id });
}
