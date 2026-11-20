"use client";

import { useEffect, useRef, useState } from "react";
import { Provider } from "react-redux";
import { makeStore, CART_STORAGE_KEY, type AppStore } from "./index";
import { hydrate, type CartItem } from "./cart/cartSlice";

/** Creates the Redux store once per browser session and persists the cart to localStorage. */
export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [store] = useState<AppStore>(() => makeStore());
  const ready = useRef(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CART_STORAGE_KEY);
      const items = raw ? (JSON.parse(raw) as CartItem[]) : [];
      store.dispatch(hydrate(Array.isArray(items) ? items : []));
    } catch {
      store.dispatch(hydrate([]));
    }
    ready.current = true;
    return store.subscribe(() => {
      if (!ready.current) return;
      try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(store.getState().cart.items));
      } catch {
        /* storage full or blocked — cart still works for this tab */
      }
    });
  }, [store]);

  return <Provider store={store}>{children}</Provider>;
}
