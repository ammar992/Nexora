"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { useQueryParams } from "@/resources/hooks/useQueryParams";
import { cn } from "@/resources/utils/cn";

function range(page: number, pages: number) {
  const out: (number | "…")[] = [];
  const add = (n: number | "…") => out.push(n);
  const win = 1;
  for (let i = 1; i <= pages; i++) {
    if (i === 1 || i === pages || (i >= page - win && i <= page + win)) add(i);
    else if (out[out.length - 1] !== "…") add("…");
  }
  return out;
}

/** URL-driven pagination with an animated active indicator. */
export function Pagination({ page, pages, className }: { page: number; pages: number; className?: string }) {
  const { set, pending } = useQueryParams();
  if (pages <= 1) return null;
  const go = (p: number) => set({ page: p > 1 ? p : null }, { scroll: true });
  return (
    <nav aria-label="Pagination" className={cn("flex items-center justify-center gap-1.5", pending && "opacity-60", className)}>
      <button type="button" onClick={() => go(page - 1)} disabled={page <= 1} className="grid size-10 place-items-center rounded-full border border-line bg-surface text-ink transition hover:border-line-strong disabled:opacity-40" aria-label="Previous page">
        <ChevronLeft className="size-4" />
      </button>
      {range(page, pages).map((p, i) =>
        p === "…" ? (
          <span key={`e${i}`} className="px-1 text-muted">
            …
          </span>
        ) : (
          <button key={p} type="button" onClick={() => go(p)} aria-current={p === page ? "page" : undefined} className={cn("relative grid size-10 place-items-center rounded-full text-sm font-semibold transition", p === page ? "text-bg" : "text-ink-soft hover:bg-surface-2")}>
            {p === page && <motion.span layoutId="page-pill" className="absolute inset-0 rounded-full bg-ink" transition={{ type: "spring", stiffness: 500, damping: 35 }} />}
            <span className="relative">{p}</span>
          </button>
        )
      )}
      <button type="button" onClick={() => go(page + 1)} disabled={page >= pages} className="grid size-10 place-items-center rounded-full border border-line bg-surface text-ink transition hover:border-line-strong disabled:opacity-40" aria-label="Next page">
        <ChevronRight className="size-4" />
      </button>
    </nav>
  );
}
