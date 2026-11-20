"use client";

import { useSyncExternalStore } from "react";

const noop = () => () => {};

/**
 * false during SSR and hydration, true afterwards. Use it to gate UI that depends on
 * browser-only state (e.g. the localStorage cart) so hydration always matches the server HTML.
 */
export function useIsClient() {
  return useSyncExternalStore(noop, () => true, () => false);
}
