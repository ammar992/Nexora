"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/resources/utils/cn";

function useOverlay(open: boolean, onClose: () => void, panel: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    const prevFocus = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    const t = setTimeout(() => {
      const first = panel.current?.querySelector<HTMLElement>("[autofocus], input, select, textarea, button:not([data-close])");
      (first ?? panel.current)?.focus();
    }, 60);
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab" && panel.current) {
        const focusables = panel.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          last.focus();
          e.preventDefault();
        } else if (!e.shiftKey && document.activeElement === last) {
          first.focus();
          e.preventDefault();
        }
      }
    }
    document.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
      prevFocus?.focus?.();
    };
  }, [open, onClose, panel]);
}

/** Centered dialog (bottom sheet on mobile) with focus trap, Esc to close and scroll lock. */
export function Modal({ open, onClose, title, description, children, className, size = "md" }: { open: boolean; onClose: () => void; title: string; description?: string; children: React.ReactNode; className?: string; size?: "sm" | "md" | "lg" }) {
  const panel = useRef<HTMLDivElement>(null);
  useOverlay(open, onClose, panel);
  if (typeof document === "undefined") return null;
  const widths = { sm: "sm:max-w-md", md: "sm:max-w-lg", lg: "sm:max-w-2xl" };
  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-6">
          <motion.div className="absolute inset-0 bg-[#0d0a08]/45 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            tabIndex={-1}
            initial={{ opacity: 0, y: 40, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 380, damping: 34 }}
            className={cn("relative max-h-[92dvh] w-full overflow-y-auto rounded-t-[28px] border border-line bg-surface p-6 shadow-float outline-none sm:rounded-[28px] sm:p-8", widths[size], className)}
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 id="modal-title" className="font-display text-2xl text-ink">
                  {title}
                </h2>
                {description && <p className="mt-1 text-sm text-muted">{description}</p>}
              </div>
              <button data-close type="button" onClick={onClose} className="grid size-9 shrink-0 place-items-center rounded-full text-muted transition hover:bg-surface-2 hover:text-ink" aria-label="Close dialog">
                <X className="size-5" />
              </button>
            </div>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

/** Side drawer, used for the cart, mobile nav and filters. */
export function Drawer({ open, onClose, title, children, side = "right", footer }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; side?: "left" | "right"; footer?: React.ReactNode }) {
  const panel = useRef<HTMLDivElement>(null);
  useOverlay(open, onClose, panel);
  if (typeof document === "undefined") return null;
  const from = side === "right" ? "100%" : "-100%";
  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[80]">
          <motion.div className="absolute inset-0 bg-[#0d0a08]/40 backdrop-blur-[3px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.aside
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            tabIndex={-1}
            initial={{ x: from }}
            animate={{ x: 0 }}
            exit={{ x: from }}
            transition={{ type: "spring", stiffness: 340, damping: 36 }}
            className={cn("absolute top-0 flex h-dvh w-[min(440px,92vw)] flex-col bg-surface shadow-float outline-none", side === "right" ? "right-0 rounded-l-[28px]" : "left-0 rounded-r-[28px]")}
          >
            <div className="flex items-center justify-between border-b border-line px-6 py-5">
              <h2 className="font-display text-2xl text-ink">{title}</h2>
              <button data-close type="button" onClick={onClose} className="grid size-10 place-items-center rounded-full text-muted transition hover:bg-surface-2 hover:text-ink" aria-label="Close">
                <X className="size-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
            {footer && <div className="border-t border-line px-6 py-5">{footer}</div>}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
