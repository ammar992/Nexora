"use client";

import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { ShoppingBag, Trash2 } from "lucide-react";
import { Drawer } from "@/components/molecules/Modal";
import { QuantityStepper } from "@/components/molecules/QuantityStepper";
import { ButtonLink } from "@/components/atoms/Button";
import { useAppDispatch, useAppSelector, selectCartSubtotal } from "@/store";
import { removeItem, setDrawer, setQuantity } from "@/store/cart/cartSlice";
import { formatMoney } from "@/resources/utils/format";

export function CartDrawer() {
  const dispatch = useAppDispatch();
  const { items, drawerOpen } = useAppSelector((s) => s.cart);
  const subtotal = useAppSelector(selectCartSubtotal);
  const close = () => dispatch(setDrawer(false));
  const currency = items[0]?.currency ?? "USD";

  return (
    <Drawer
      open={drawerOpen}
      onClose={close}
      title="Your cart"
      footer={
        items.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-muted">Subtotal</span>
              <span className="font-display text-2xl text-ink">{formatMoney(subtotal, currency)}</span>
            </div>
            <p className="text-[13px] text-muted">Shipping is calculated per seller at checkout.</p>
            <div className="grid grid-cols-2 gap-3">
              <ButtonLink href="/cart" variant="secondary" onClick={close}>
                View cart
              </ButtonLink>
              <ButtonLink href="/checkout" onClick={close}>
                Checkout
              </ButtonLink>
            </div>
          </div>
        ) : null
      }
    >
      {items.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center py-16 text-center">
          <div className="mb-5 grid size-16 place-items-center rounded-2xl bg-accent-soft text-accent">
            <ShoppingBag className="size-7" />
          </div>
          <p className="font-display text-2xl text-ink">Nothing here yet</p>
          <p className="mt-2 max-w-xs text-sm text-muted">Pieces you add will wait here while you keep browsing.</p>
          <ButtonLink href="/explore?type=product" className="mt-6" onClick={close}>
            Browse products
          </ButtonLink>
        </div>
      ) : (
        <ul className="space-y-4">
          <AnimatePresence initial={false}>
            {items.map((item) => (
              <motion.li key={item.listingId} layout initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 60, height: 0, marginTop: 0 }} className="flex gap-4">
                <Link href={`/listing/${item.slug}`} onClick={close} className="relative size-20 shrink-0 overflow-hidden rounded-2xl bg-surface-2">
                  {item.image && <Image src={item.image} alt={item.title} fill sizes="80px" className="object-cover" />}
                </Link>
                <div className="min-w-0 flex-1">
                  <Link href={`/listing/${item.slug}`} onClick={close} className="line-clamp-2 text-sm font-semibold text-ink hover:text-accent">
                    {item.title}
                  </Link>
                  <p className="text-[12px] text-muted">{item.vendorName}</p>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <QuantityStepper size="sm" value={item.quantity} max={Math.max(1, item.stock)} onChange={(q) => dispatch(setQuantity({ listingId: item.listingId, quantity: q }))} />
                    <span className="text-sm font-semibold text-ink">{formatMoney(item.price * item.quantity, item.currency)}</span>
                  </div>
                </div>
                <button type="button" onClick={() => dispatch(removeItem(item.listingId))} className="grid size-8 shrink-0 place-items-center self-start rounded-full text-muted transition hover:bg-danger-soft hover:text-danger" aria-label={`Remove ${item.title}`}>
                  <Trash2 className="size-4" />
                </button>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </Drawer>
  );
}
