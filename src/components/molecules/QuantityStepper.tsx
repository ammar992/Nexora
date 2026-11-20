"use client";

import { Minus, Plus } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/resources/utils/cn";

export function QuantityStepper({ value, onChange, min = 1, max = 99, size = "md" }: { value: number; onChange: (v: number) => void; min?: number; max?: number; size?: "sm" | "md" }) {
  const btn = cn("grid place-items-center rounded-full text-ink transition hover:bg-surface-2 disabled:opacity-30", size === "sm" ? "size-8" : "size-10");
  return (
    <div className="inline-flex items-center rounded-full border border-line bg-surface p-0.5">
      <button type="button" className={btn} onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min} aria-label="Decrease quantity">
        <Minus className="size-4" />
      </button>
      <span className={cn("relative overflow-hidden text-center font-semibold tabular-nums", size === "sm" ? "w-7 text-sm" : "w-9")} aria-live="polite">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span key={value} className="block" initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -12, opacity: 0 }} transition={{ duration: 0.18 }}>
            {value}
          </motion.span>
        </AnimatePresence>
      </span>
      <button type="button" className={btn} onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max} aria-label="Increase quantity">
        <Plus className="size-4" />
      </button>
    </div>
  );
}
