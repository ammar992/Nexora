"use client";

import { motion } from "framer-motion";
import { Logo } from "@/components/atoms/Logo";
import { SmartImage } from "@/components/atoms/SmartImage";

/** Split-screen auth layout: editorial image collage on the left, form on the right. */
export function AuthShell({ siteName, logoUrl, images, children }: { siteName: string; logoUrl?: string; images: { url: string; alt: string }[]; children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-ink lg:block">
        <div className="absolute inset-0 grid grid-cols-2 grid-rows-3 gap-3 p-3 opacity-90">
          {images.slice(0, 3).map((img, i) => (
            <motion.div
              key={img.url}
              initial={{ opacity: 0, scale: 1.08 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.2, delay: i * 0.15, ease: [0.25, 1, 0.5, 1] }}
              className={i === 0 ? "relative col-span-2 row-span-2 overflow-hidden rounded-[28px]" : "relative overflow-hidden rounded-[28px]"}
            >
              <SmartImage src={img.url} alt={img.alt} fill sizes="50vw" priority={i === 0} />
            </motion.div>
          ))}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-12 text-bg">
          <p className="font-display text-[2.6rem] leading-[1.05] tracking-tight">
            Made by people.
            <br />
            <em className="text-accent">Booked by you.</em>
          </p>
          <p className="mt-4 max-w-sm text-bg/70">Independent makers and service pros, reviewed by our team and rated by real customers.</p>
        </div>
      </aside>
      <div className="flex flex-col px-4 py-6 sm:px-10 lg:px-16">
        <Logo name={siteName} logoUrl={logoUrl} />
        <main id="main" className="flex flex-1 items-center py-10">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.25, 1, 0.5, 1] }} className="mx-auto w-full max-w-[440px]">
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
