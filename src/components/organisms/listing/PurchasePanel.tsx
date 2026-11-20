"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ShoppingBag, Zap, Truck, PackageCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/atoms/Button";
import { QuantityStepper } from "@/components/molecules/QuantityStepper";
import { useAppDispatch, useAppSelector } from "@/store";
import { addItem, setDrawer } from "@/store/cart/cartSlice";
import { useIsClient } from "@/resources/hooks/useIsClient";
import { formatMoney } from "@/resources/utils/format";

type Props = {
  listing: { _id: string; slug: string; title: string; image: string; price: number; stock: number; shippingFee: number; currency: string; vendorName: string };
  disabled?: string;
};

export function PurchasePanel({ listing, disabled }: Props) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const isClient = useIsClient();
  const storedInCart = useAppSelector((s) => s.cart.items.find((i) => i.listingId === listing._id)?.quantity ?? 0);
  const inCart = isClient ? storedInCart : 0;
  const [qty, setQty] = useState(1);
  const remaining = Math.max(0, listing.stock - inCart);
  const soldOut = listing.stock <= 0;

  function add(openCart: boolean) {
    if (remaining <= 0) {
      toast.error(`You already have all ${listing.stock} in your cart.`);
      return false;
    }
    dispatch(addItem({ listingId: listing._id, slug: listing.slug, title: listing.title, image: listing.image, price: listing.price, quantity: Math.min(qty, remaining), stock: listing.stock, vendorName: listing.vendorName, currency: listing.currency }));
    if (openCart) dispatch(setDrawer(true));
    return true;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 text-sm">
        {soldOut ? (
          <span className="font-semibold text-danger">Sold out</span>
        ) : listing.stock <= 5 ? (
          <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="inline-flex items-center gap-2 font-semibold text-warning">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-warning opacity-60" />
              <span className="relative inline-flex size-2 rounded-full bg-warning" />
            </span>
            Only {listing.stock} left
          </motion.span>
        ) : (
          <span className="inline-flex items-center gap-2 font-semibold text-success">
            <PackageCheck className="size-4" /> In stock
          </span>
        )}
        {inCart > 0 && <span className="text-muted">· {inCart} in your cart</span>}
      </div>
      {disabled ? (
        <p className="rounded-2xl bg-surface-2 px-4 py-3 text-sm text-muted">{disabled}</p>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <QuantityStepper value={qty} onChange={setQty} max={Math.max(1, remaining)} />
            <Button size="lg" className="flex-1" disabled={soldOut || remaining <= 0} onClick={() => add(true) && toast.success("Added to your cart")}>
              <ShoppingBag className="size-[18px]" /> Add to cart
            </Button>
          </div>
          <Button size="lg" variant="dark" className="w-full" disabled={soldOut || remaining <= 0} onClick={() => add(false) && router.push("/checkout")}>
            <Zap className="size-[18px]" /> Buy now
          </Button>
        </>
      )}
      <p className="flex items-center gap-2 text-[13px] text-muted">
        <Truck className="size-4" /> {listing.shippingFee > 0 ? `${formatMoney(listing.shippingFee, listing.currency)} shipping from this vendor` : "Free shipping from this vendor"}
      </p>
    </div>
  );
}
