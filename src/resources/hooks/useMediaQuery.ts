"use client";

import { useSyncExternalStore } from "react";

/** SSR-safe media query hook (returns `fallback` on the server). */
export function useMediaQuery(query: string, fallback = false) {
  return useSyncExternalStore(
    (cb) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", cb);
      return () => mql.removeEventListener("change", cb);
    },
    () => window.matchMedia(query).matches,
    () => fallback
  );
}

export const useIsMobile = () => useMediaQuery("(max-width: 767px)");
export const usePrefersReducedMotion = () => useMediaQuery("(prefers-reduced-motion: reduce)");
