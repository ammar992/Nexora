"use client";

import { useEffect, useState } from "react";
import { api } from "@/interceptor/api";
import { useAppDispatch, useAppSelector } from "@/store";
import { syncItems } from "@/store/cart/cartSlice";
import { useIsClient } from "./useIsClient";

export type LiveLine = { listingId: string; title: string; slug: string; price: number; stock: number; shippingFee: number; image: string; vendorId: string; vendorName: string; available: boolean; currency: string };

/** Refreshes cart lines with live price/stock from the server once the cart is hydrated. */
export function useCartSync() {
  const dispatch = useAppDispatch();
  const { items, hydrated } = useAppSelector((s) => s.cart);
  const [live, setLive] = useState<Record<string, LiveLine>>({});
  const [fetchedFor, setFetchedFor] = useState<string | null>(null);
  const ids = items.map((i) => i.listingId).sort().join(",");

  useEffect(() => {
    if (!hydrated || !ids) return;
    let cancelled = false;
    api
      .post<{ items: LiveLine[] }>("/cart/quote", { ids: ids.split(",") })
      .then((res) => {
        if (cancelled) return;
        setLive(Object.fromEntries(res.items.map((l) => [l.listingId, l])));
        dispatch(syncItems(res.items));
      })
      .catch(() => {})
      .finally(() => !cancelled && setFetchedFor(ids));
    return () => {
      cancelled = true;
    };
  }, [hydrated, ids, dispatch]);

  // Only the first quote shows a loading state; later quantity changes refresh silently.
  const isClient = useIsClient();
  const loading = !isClient || !hydrated || (ids !== "" && fetchedFor === null);
  return { items, live, loading };
}
