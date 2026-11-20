"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Search, MapPin, LayoutGrid, ArrowRight } from "lucide-react";
import { cn } from "@/resources/utils/cn";

type Cat = { slug: string; name: string };

/** Keyword + category + location search that routes to /explore. */
export function SearchBar({ categories, initial, className, compact }: { categories: Cat[]; initial?: { q?: string; category?: string; city?: string }; className?: string; compact?: boolean }) {
  const router = useRouter();
  const [q, setQ] = useState(initial?.q ?? "");
  const [category, setCategory] = useState(initial?.category ?? "");
  const [city, setCity] = useState(initial?.city ?? "");
  const [focused, setFocused] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const p = new URLSearchParams();
    if (q.trim()) p.set("q", q.trim());
    if (category) p.set("category", category);
    if (city.trim()) p.set("city", city.trim());
    router.push(`/explore${p.size ? `?${p}` : ""}`);
  }

  const seg = "flex min-w-0 items-center gap-2.5 px-4";
  return (
    <motion.form
      role="search"
      onSubmit={submit}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      animate={{ boxShadow: focused ? "0 24px 60px -20px rgb(30 20 10 / 0.35), 0 0 0 4px var(--ring)" : "0 18px 50px -24px rgb(30 20 10 / 0.3)" }}
      transition={{ duration: 0.25 }}
      className={cn("glass flex w-full flex-col gap-1 rounded-[28px] border border-line p-2 md:flex-row md:items-center md:gap-0 md:rounded-full", className)}
    >
      <label className={cn(seg, "h-12 flex-[1.4] md:h-14")}>
        <Search className="size-[18px] shrink-0 text-muted" aria-hidden />
        <span className="sr-only">Search</span>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={compact ? "Search" : "Ceramics, portrait session, tailoring…"} className="h-full w-full min-w-0 bg-transparent text-[15px] text-ink outline-none placeholder:text-muted" maxLength={100} />
      </label>
      <span className="hidden h-8 w-px bg-line md:block" aria-hidden />
      <label className={cn(seg, "h-12 flex-1 border-t border-line md:h-14 md:border-0")}>
        <LayoutGrid className="size-[18px] shrink-0 text-muted" aria-hidden />
        <span className="sr-only">Category</span>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="h-full w-full min-w-0 cursor-pointer appearance-none bg-transparent text-[15px] text-ink outline-none">
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
      </label>
      <span className="hidden h-8 w-px bg-line md:block" aria-hidden />
      <label className={cn(seg, "h-12 flex-1 border-t border-line md:h-14 md:border-0")}>
        <MapPin className="size-[18px] shrink-0 text-muted" aria-hidden />
        <span className="sr-only">City</span>
        <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Any city" className="h-full w-full min-w-0 bg-transparent text-[15px] text-ink outline-none placeholder:text-muted" maxLength={60} />
      </label>
      <motion.button type="submit" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.95 }} className="sheen mt-1 inline-flex h-12 items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold text-accent-ink md:mt-0 md:h-14 md:px-7">
        Search <ArrowRight className="size-4" />
      </motion.button>
    </motion.form>
  );
}
