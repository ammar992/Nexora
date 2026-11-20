import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type CartItem = {
  listingId: string;
  slug: string;
  title: string;
  image: string;
  price: number;
  quantity: number;
  stock: number;
  vendorName: string;
  currency: string;
};

type CartState = { items: CartItem[]; drawerOpen: boolean; hydrated: boolean };

const initialState: CartState = { items: [], drawerOpen: false, hydrated: false };

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    hydrate(state, action: PayloadAction<CartItem[]>) {
      state.items = action.payload;
      state.hydrated = true;
    },
    addItem(state, action: PayloadAction<CartItem>) {
      const existing = state.items.find((i) => i.listingId === action.payload.listingId);
      if (existing) {
        existing.quantity = Math.min(existing.quantity + action.payload.quantity, Math.max(1, action.payload.stock), 99);
        existing.price = action.payload.price;
        existing.stock = action.payload.stock;
      } else {
        state.items.push({ ...action.payload, quantity: Math.min(action.payload.quantity, Math.max(1, action.payload.stock), 99) });
      }
    },
    setQuantity(state, action: PayloadAction<{ listingId: string; quantity: number }>) {
      const item = state.items.find((i) => i.listingId === action.payload.listingId);
      if (item) item.quantity = Math.max(1, Math.min(action.payload.quantity, Math.max(1, item.stock), 99));
    },
    removeItem(state, action: PayloadAction<string>) {
      state.items = state.items.filter((i) => i.listingId !== action.payload);
    },
    /** Applies live price/stock from the server; drops items that no longer exist. */
    syncItems(state, action: PayloadAction<{ listingId: string; price: number; stock: number; available: boolean; title: string; image: string }[]>) {
      const live = new Map(action.payload.map((l) => [l.listingId, l]));
      state.items = state.items
        .filter((i) => live.has(i.listingId))
        .map((i) => {
          const l = live.get(i.listingId)!;
          return { ...i, price: l.price, stock: l.available ? l.stock : 0, title: l.title, image: l.image || i.image, quantity: Math.max(1, Math.min(i.quantity, Math.max(1, l.stock))) };
        });
    },
    clearCart(state) {
      state.items = [];
    },
    setDrawer(state, action: PayloadAction<boolean>) {
      state.drawerOpen = action.payload;
    },
  },
});

export const { hydrate, addItem, setQuantity, removeItem, syncItems, clearCart, setDrawer } = cartSlice.actions;
export default cartSlice.reducer;
