"use client";

import { useCallback, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/**
 * Reads and updates URL search params. Lists, filters and dashboards keep their state in the URL
 * so pages stay server-rendered, shareable and back-button friendly.
 */
export function useQueryParams() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  const set = useCallback(
    (updates: Record<string, string | number | null | undefined>, opts: { resetPage?: boolean; scroll?: boolean } = {}) => {
      const next = new URLSearchParams(params.toString());
      for (const [k, v] of Object.entries(updates)) {
        if (v === null || v === undefined || v === "") next.delete(k);
        else next.set(k, String(v));
      }
      if (opts.resetPage !== false && !("page" in updates)) next.delete("page");
      const qs = next.toString();
      startTransition(() => router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: opts.scroll ?? false }));
    },
    [params, pathname, router]
  );

  return { params, set, pending, get: (k: string) => params.get(k) ?? "" };
}
