"use client";

import { motion } from "framer-motion";
import { Check, Clock } from "lucide-react";
import { ButtonLink } from "@/components/atoms/Button";
import { StatusBadge } from "@/components/atoms/Badge";
import { formatDate, formatMoney, formatTime } from "@/resources/utils/format";

type Order = { _id: string; reference: string; total: number; currency: string; status: string; paymentStatus: string; paymentMethod: string; vendor: { storeName: string }; items: { title: string; quantity: number }[] };
type Booking = { _id: string; reference: string; total: number; currency: string; status: string; paymentStatus: string; paymentMethod: string; date: string; timeSlot: string; guests: number; vendor: { storeName: string }; listingSnapshot: { title: string } };

export function CheckoutSuccess({ kind, orders, booking }: { kind: "order" | "booking"; orders?: Order[]; booking?: Booking }) {
  const paid = kind === "order" ? orders!.every((o) => o.paymentStatus === "paid") : booking!.paymentStatus === "paid";
  const awaitingWebhook = !paid && (kind === "order" ? orders!.some((o) => o.status === "pending_payment") : booking!.status === "pending_payment");
  return (
    <div className="container-x max-w-3xl pt-32 md:pt-40">
      <div className="text-center">
        <motion.div initial={{ scale: 0, rotate: -45 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 260, damping: 14 }} className="mx-auto grid size-20 place-items-center rounded-full bg-success text-white shadow-[0_20px_50px_-15px_var(--success)]">
          <motion.span initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}>
            <Check className="size-10" strokeWidth={3} />
          </motion.span>
        </motion.div>
        <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="display-lg mt-8 text-ink">
          {kind === "order" ? "Order placed." : booking!.status === "confirmed" ? "You're booked." : "Request sent."}
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }} className="mx-auto mt-4 max-w-lg text-lg text-muted">
          {awaitingWebhook
            ? "We're confirming your payment with the provider. This page updates in your account within a minute."
            : kind === "order"
              ? paid ? "Payment received. The seller has been notified and will ship soon." : "Pay the seller when your order arrives. They've been notified and will prepare it."
              : booking!.status === "confirmed" ? "Your slot is confirmed and the vendor is expecting you." : "The vendor will confirm your slot shortly. We'll email you when they do."}
        </motion.p>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="mt-12 space-y-4">
        {kind === "order" &&
          orders!.map((o) => (
            <div key={o._id} className="rounded-[28px] border border-line bg-surface p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[13px] text-muted">Order {o.reference}</p>
                  <p className="font-display text-xl text-ink">{o.vendor?.storeName}</p>
                </div>
                <StatusBadge status={o.status} />
              </div>
              <p className="mt-3 text-sm text-muted">{o.items.map((i) => `${i.quantity}× ${i.title}`).join(", ")}</p>
              <p className="mt-3 font-semibold text-ink">{formatMoney(o.total, o.currency)}</p>
            </div>
          ))}
        {kind === "booking" && (
          <div className="rounded-[28px] border border-line bg-surface p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[13px] text-muted">Booking {booking!.reference}</p>
                <p className="font-display text-xl text-ink">{booking!.listingSnapshot.title}</p>
                <p className="text-sm text-muted">with {booking!.vendor?.storeName}</p>
              </div>
              <StatusBadge status={booking!.status} />
            </div>
            <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-surface-2 px-4 py-2 text-sm font-semibold text-ink">
              <Clock className="size-4" /> {formatDate(booking!.date, { weekday: "long" })} at {formatTime(booking!.timeSlot)} · {booking!.guests} guest{booking!.guests > 1 ? "s" : ""}
            </p>
            <p className="mt-3 font-semibold text-ink">{formatMoney(booking!.total, booking!.currency)}</p>
          </div>
        )}
      </motion.div>

      <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
        <ButtonLink href={kind === "order" ? "/account/orders" : "/account/bookings"} size="lg">
          Track {kind === "order" ? "your order" : "your booking"}
        </ButtonLink>
        <ButtonLink href="/explore" variant="secondary" size="lg">
          Keep exploring
        </ButtonLink>
      </div>
    </div>
  );
}
