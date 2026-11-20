"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/resources/utils/cn";

/** Accessible popover menu that closes on outside click / Escape. */
export function Dropdown({ trigger, children, align = "right", className, label }: { trigger: (open: boolean) => React.ReactNode; children: (close: () => void) => React.ReactNode; align?: "left" | "right"; className?: string; label: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
  return (
    <div ref={ref} className="relative">
      <button type="button" aria-haspopup="menu" aria-expanded={open} aria-label={label} onClick={() => setOpen((o) => !o)} className="rounded-full">
        {trigger(open)}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.25, 1, 0.5, 1] }}
            style={{ transformOrigin: align === "right" ? "top right" : "top left" }}
            className={cn("absolute top-[calc(100%+10px)] z-50 min-w-60 overflow-hidden rounded-3xl border border-line bg-surface p-2 shadow-float", align === "right" ? "right-0" : "left-0", className)}
          >
            {children(() => setOpen(false))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function MenuItem({ children, onClick, href, icon, danger }: { children: React.ReactNode; onClick?: () => void; href?: string; icon?: React.ReactNode; danger?: boolean }) {
  const cls = cn("flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm font-medium transition-colors [&_svg]:size-[17px]", danger ? "text-danger hover:bg-danger-soft" : "text-ink-soft hover:bg-surface-2 hover:text-ink");
  if (href) {
    return (
      <a role="menuitem" href={href} onClick={onClick} className={cls}>
        {icon}
        {children}
      </a>
    );
  }
  return (
    <button role="menuitem" type="button" onClick={onClick} className={cls}>
      {icon}
      {children}
    </button>
  );
}
