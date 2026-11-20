import { configureStore } from "@reduxjs/toolkit";
import { useDispatch, useSelector, type TypedUseSelectorHook } from "react-redux";
import cartReducer from "./cart/cartSlice";

export const CART_STORAGE_KEY = "nexora.cart.v1";

export function makeStore() {
  return configureStore({ reducer: { cart: cartReducer } });
}

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export const selectCartCount = (s: RootState) => s.cart.items.reduce((n, i) => n + i.quantity, 0);
export const selectCartSubtotal = (s: RootState) => s.cart.items.reduce((n, i) => n + i.price * i.quantity, 0);
