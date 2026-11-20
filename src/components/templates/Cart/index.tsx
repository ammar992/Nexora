"use client";

import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ShoppingBag, Trash2, AlertCircle, Store } from "lucide-react";
import { ButtonLink } from "@/components/atoms/Button";
import { QuantityStepper } from "@/components/molecules/QuantityStepper";
import { EmptyState } from "@/components/molecules/EmptyState";
import { useAppDispatch } from "@/store";
import { removeItem, setQuantity } from "@/store/cart/cartSlice";
import { useCartSync } from "@/resources/hooks/useCartSync";
import { formatMoney } from "@/resources/utils/format";

export function CartTemplate() {
  const dispatch = useAppDispatch();
  const params = useSearchParams();
  const { items, live, loading } = useCartSync();
  const groups = new Map<string, { vendor: string; lines: typeof items; shipping: number }>();
  for (const i of items) {
    const l = live[i.listingId];
    const key = l?.vendorId ?? i.vendorName;
    const g = groups.get(key) ?? { vendor: l?.vendorName ?? i.vendorName, lines: [], shipping: 0 };
    g.lines.push(i);
    g.shipping = Math.max(g.shipping, l?.shippingFee ?? 0);
    groups.set(key, g);
  }
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const shipping = [...groups.values()].reduce((s, g) => s + g.shipping, 0);
  const unavailable = items.some((i) => live[i.listingId] && (!live[i.listingId].available || live[i.listingId].stock < i.quantity));
  const currency = items[0]?.currency ?? "USD";

  return (
    <div className="container-x pt-28 md:pt-36">
      <h1 className="display-lg text-ink">Your cart</h1>
      {params.get("cancelled") && <p className="mt-4 rounded-2xl bg-warning-soft px-4 py-3 text-sm font-semibold text-warning">Payment was cancelled. Nothing was charged and your items are still here.</p>}

      {loading ? (
        <div className="mt-10 grid gap-8 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-8">{[0, 1, 2].map((i) => <div key={i} className="skeleton h-32 rounded-3xl" />)}</div>
          <div className="skeleton h-64 rounded-3xl lg:col-span-4" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState className="mt-10" icon={<ShoppingBag />} title="Your cart is empty" description="Find something made with care and it will wait for you here." action={<ButtonLink href="/explore?type=product">Browse products</ButtonLink>} />
      ) : (
        <div className="mt-10 grid gap-8 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-8">
            {[...groups.entries()].map(([key, g]) => (
              <section key={key} className="rounded-[28px] border border-line bg-surface p-5 md:p-6">
                <header className="mb-4 flex items-center justify-between border-b border-line pb-4">
                  <p className="flex items-center gap-2 font-semibold text-ink">
                    <Store className="size-4 text-accent" /> {g.vendor}
                  </p>
                  <p className="text-[13px] text-muted">{g.shipping > 0 ? `${formatMoney(g.shipping, currency)} shipping` : "Free shipping"}</p>
                </header>
                <ul className="divide-y divide-line">
                  <AnimatePresence initial={false}>
                    {g.lines.map((i) => {
                      const l = live[i.listingId];
                      const problem = l && !l.available ? "No longer available" : l && l.stock < i.quantity ? (l.stock > 0 ? `Only ${l.stock} left` : "Sold out") : null;
                      return (
                        <motion.li key={i.listingId} layout exit={{ opacity: 0, height: 0 }} className="flex gap-4 py-4">
                          <Link href={`/listing/${i.slug}`} className="relative size-24 shrink-0 overflow-hidden rounded-2xl bg-surface-2">
                            {i.image && <Image src={i.image} alt={i.title} fill sizes="96px" className="object-cover" />}
                          </Link>
                          <div className="flex min-w-0 flex-1 flex-col">
                            <div className="flex items-start justify-between gap-3">
                              <Link href={`/listing/${i.slug}`} className="font-display text-lg leading-snug text-ink hover:text-accent">{i.title}</Link>
                              <span className="shrink-0 font-semibold text-ink">{formatMoney(i.price * i.quantity, i.currency)}</span>
                            </div>
                            <p className="text-[13px] text-muted">{formatMoney(i.price, i.currency)} each</p>
                            {problem && (
                              <p className="mt-1 inline-flex items-center gap-1 text-[13px] font-semibold text-danger">
                                <AlertCircle className="size-3.5" /> {problem}
                              </p>
                            )}
                            <div className="mt-auto flex items-center justify-between pt-3">
                              <QuantityStepper size="sm" value={i.quantity} max={Math.max(1, i.stock)} onChange={(q) => dispatch(setQuantity({ listingId: i.listingId, quantity: q }))} />
                              <button type="button" onClick={() => dispatch(removeItem(i.listingId))} className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-muted hover:text-danger">
                                <Trash2 className="size-4" /> Remove
                              </button>
                            </div>
                          </div>
                        </motion.li>
                      );
                    })}
                  </AnimatePresence>
                </ul>
              </section>
            ))}
          </div>
          <aside className="lg:col-span-4">
            <div className="sticky top-28 rounded-[28px] bg-ink p-6 text-bg md:p-7">
              <h2 className="font-display text-2xl">Summary</h2>
              <dl className="mt-6 space-y-3 text-sm">
                <div className="flex justify-between"><dt className="text-bg/60">Subtotal</dt><dd>{formatMoney(subtotal, currency)}</dd></div>
                <div className="flex justify-between"><dt className="text-bg/60">Shipping ({groups.size} seller{groups.size > 1 ? "s" : ""})</dt><dd>{shipping ? formatMoney(shipping, currency) : "Free"}</dd></div>
                <div className="flex justify-between border-t border-bg/15 pt-4 text-base"><dt>Total</dt><dd className="font-display text-3xl">{formatMoney(subtotal + shipping, currency)}</dd></div>
              </dl>
              {unavailable && <p className="mt-4 text-[13px] text-[#ffb4a2]">Fix the items marked above to continue.</p>}
              <ButtonLink href={unavailable ? "#" : "/checkout"} size="lg" className={unavailable ? "pointer-events-none mt-6 w-full opacity-50" : "mt-6 w-full"} aria-disabled={unavailable}>
                Checkout
              </ButtonLink>
              <p className="mt-4 text-center text-[12px] text-bg/50">Orders are split by seller so each ships on its own.</p>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
