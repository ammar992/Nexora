"use client";

import { useEffect, useRef } from "react";
import { animate, useInView, useReducedMotion } from "framer-motion";
import { cn } from "@/resources/utils/cn";
import { formatMoney } from "@/resources/utils/format";

function CountUp({ value, money, currency }: { value: number; money?: boolean; currency?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const reduce = useReducedMotion();
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fmt = (n: number) => (money ? formatMoney(Math.round(n * 100) / 100, currency) : Math.round(n).toLocaleString("en-US"));
    if (!inView || reduce) {
      el.textContent = fmt(value);
      return;
    }
    const controls = animate(0, value, { duration: 1.1, ease: [0.25, 1, 0.5, 1], onUpdate: (v) => (el.textContent = fmt(v)) });
    return () => controls.stop();
  }, [inView, value, money, currency, reduce]);
  return <span ref={ref}>{money ? formatMoney(0, currency) : "0"}</span>;
}

export function StatCard({ label, value, icon, money, currency, hint, tone = "neutral", className }: { label: string; value: number; icon?: React.ReactNode; money?: boolean; currency?: string; hint?: React.ReactNode; tone?: "neutral" | "accent" | "dark"; className?: string }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl border p-5 transition-shadow duration-300 hover:shadow-lift sm:p-6",
        tone === "accent" && "border-transparent bg-accent text-accent-ink",
        tone === "dark" && "border-transparent bg-ink text-bg",
        tone === "neutral" && "border-line bg-surface",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className={cn("text-[13px] font-semibold", tone === "neutral" ? "text-muted" : "opacity-80")}>{label}</p>
        {icon && <span className={cn("grid size-9 place-items-center rounded-xl [&_svg]:size-[18px]", tone === "neutral" ? "bg-surface-2 text-ink-soft" : "bg-white/15")}>{icon}</span>}
      </div>
      <p className="mt-3 font-display text-[2rem] leading-none tracking-tight sm:text-[2.3rem]">
        <CountUp value={value} money={money} currency={currency} />
      </p>
      {hint && <p className={cn("mt-2 text-[13px]", tone === "neutral" ? "text-muted" : "opacity-80")}>{hint}</p>}
    </div>
  );
}
