"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/resources/utils/cn";

export function Stars({ value, size = 14, className }: { value: number; size?: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)} aria-label={`${value.toFixed(1)} out of 5 stars`} role="img">
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = Math.max(0, Math.min(1, value - i + 1));
        return (
          <span key={i} className="relative inline-block" style={{ width: size, height: size }}>
            <Star className="absolute inset-0 text-line-strong" style={{ width: size, height: size }} strokeWidth={0} fill="currentColor" aria-hidden />
            <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
              <Star className="text-accent" style={{ width: size, height: size }} strokeWidth={0} fill="currentColor" aria-hidden />
            </span>
          </span>
        );
      })}
    </span>
  );
}

export function RatingInput({ value, onChange, error }: { value: number; onChange: (v: number) => void; error?: string }) {
  const [hover, setHover] = useState(0);
  const labels = ["", "Poor", "Fair", "Good", "Great", "Exceptional"];
  const shown = hover || value;
  return (
    <div>
      <div className="flex items-center gap-1" role="radiogroup" aria-label="Rating" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((i) => (
          <motion.button
            key={i}
            type="button"
            role="radio"
            aria-checked={value === i}
            aria-label={`${i} star${i > 1 ? "s" : ""}`}
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
            onMouseEnter={() => setHover(i)}
            onFocus={() => setHover(i)}
            onBlur={() => setHover(0)}
            onClick={() => onChange(i)}
            className="rounded-md p-0.5"
          >
            <Star className={cn("size-8 transition-colors", i <= shown ? "text-accent" : "text-line-strong")} strokeWidth={0} fill="currentColor" />
          </motion.button>
        ))}
        <span className="ml-2 text-sm font-semibold text-ink-soft">{labels[shown]}</span>
      </div>
      {error && <p className="pt-1 text-[13px] font-medium text-danger">{error}</p>}
    </div>
  );
}
