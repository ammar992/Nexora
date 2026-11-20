"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
import { createPortal } from "react-dom";
import { cn } from "@/resources/utils/cn";

type Img = { url: string; alt?: string };

export function Gallery({ images, title }: { images: Img[]; title: string }) {
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState(1);
  const [open, setOpen] = useState(false);
  const count = images.length;
  const go = useCallback(
    (n: number) => {
      setDir(n > index ? 1 : -1);
      setIndex(((n % count) + count) % count);
    },
    [count, index]
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      if (e.key === "ArrowRight") go(index + 1);
      if (e.key === "ArrowLeft") go(index - 1);
    };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    };
  }, [open, go, index]);

  if (!count) return <div className="aspect-square rounded-[32px] bg-surface-2" />;
  const current = images[index];

  return (
    <div className="flex flex-col-reverse gap-3 md:flex-row">
      {count > 1 && (
        <div className="scrollbar-none flex gap-2 overflow-x-auto md:w-20 md:flex-col">
          {images.map((img, i) => (
            <button key={img.url} type="button" onClick={() => go(i)} aria-label={`Show photo ${i + 1}`} aria-current={i === index} className={cn("relative aspect-square w-16 shrink-0 overflow-hidden rounded-2xl border-2 transition md:w-full", i === index ? "border-accent" : "border-transparent opacity-60 hover:opacity-100")}>
              <Image src={img.url} alt="" fill sizes="80px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
      <div className="group relative aspect-square flex-1 overflow-hidden rounded-[32px] bg-surface-2 md:aspect-[5/6]">
        <AnimatePresence initial={false} custom={dir} mode="popLayout">
          <motion.div
            key={current.url}
            custom={dir}
            initial={{ opacity: 0, x: dir * 40, scale: 1.03 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: dir * -40 }}
            transition={{ duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
            drag={count > 1 ? "x" : false}
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={(_, info) => {
              if (info.offset.x < -60) go(index + 1);
              if (info.offset.x > 60) go(index - 1);
            }}
            className="absolute inset-0"
          >
            <Image src={current.url} alt={current.alt || `${title}, photo ${index + 1}`} fill priority={index === 0} sizes="(max-width: 1024px) 100vw, 55vw" className="pointer-events-none object-cover" />
          </motion.div>
        </AnimatePresence>
        <button type="button" onClick={() => setOpen(true)} className="glass absolute top-4 right-4 grid size-11 place-items-center rounded-full text-ink opacity-0 shadow-soft transition group-hover:opacity-100 focus:opacity-100" aria-label="View full screen">
          <Expand className="size-[18px]" />
        </button>
        {count > 1 && (
          <>
            <button type="button" onClick={() => go(index - 1)} className="glass absolute top-1/2 left-4 hidden size-11 -translate-y-1/2 place-items-center rounded-full text-ink opacity-0 transition group-hover:opacity-100 md:grid" aria-label="Previous photo">
              <ChevronLeft className="size-5" />
            </button>
            <button type="button" onClick={() => go(index + 1)} className="glass absolute top-1/2 right-4 hidden size-11 -translate-y-1/2 place-items-center rounded-full text-ink opacity-0 transition group-hover:opacity-100 md:grid" aria-label="Next photo">
              <ChevronRight className="size-5" />
            </button>
            <span className="glass absolute bottom-4 left-4 rounded-full px-3 py-1 text-xs font-semibold text-ink">
              {index + 1} / {count}
            </span>
          </>
        )}
      </div>

      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {open && (
              <motion.div role="dialog" aria-modal="true" aria-label={`${title} photos`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[90] grid place-items-center bg-[#0d0a08]/95 p-4">
                <button type="button" onClick={() => setOpen(false)} className="absolute top-5 right-5 grid size-12 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20" aria-label="Close">
                  <X className="size-6" />
                </button>
                <motion.div key={current.url} initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative h-[80vh] w-full max-w-5xl">
                  <Image src={current.url} alt={current.alt || title} fill sizes="100vw" className="object-contain" />
                </motion.div>
                {count > 1 && (
                  <div className="absolute bottom-6 flex gap-3">
                    <button type="button" onClick={() => go(index - 1)} className="grid size-12 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20" aria-label="Previous photo">
                      <ChevronLeft />
                    </button>
                    <button type="button" onClick={() => go(index + 1)} className="grid size-12 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20" aria-label="Next photo">
                      <ChevronRight />
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </div>
  );
}
