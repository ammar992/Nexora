"use client";

import { motion } from "framer-motion";
import { cn } from "@/resources/utils/cn";

/** Segmented tabs with a sliding pill indicator. */
export function Tabs<T extends string>({ value, onChange, items, id, className }: { value: T; onChange: (v: T) => void; items: { value: T; label: React.ReactNode; count?: number }[]; id: string; className?: string }) {
  return (
    <div role="tablist" className={cn("scrollbar-none inline-flex max-w-full gap-1 overflow-x-auto rounded-full border border-line bg-surface p-1", className)}>
      {items.map((it) => {
        const active = it.value === value;
        return (
          <button
            key={it.value}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(it.value)}
            className={cn("relative shrink-0 rounded-full px-4 py-2 text-[13px] font-semibold transition-colors", active ? "text-bg" : "text-muted hover:text-ink")}
          >
            {active && <motion.span layoutId={`tab-${id}`} className="absolute inset-0 rounded-full bg-ink" transition={{ type: "spring", stiffness: 500, damping: 38 }} />}
            <span className="relative inline-flex items-center gap-1.5">
              {it.label}
              {it.count !== undefined && <span className={cn("rounded-full px-1.5 text-[11px]", active ? "bg-white/20" : "bg-surface-2")}>{it.count}</span>}
            </span>
          </button>
        );
      })}
    </div>
  );
}
