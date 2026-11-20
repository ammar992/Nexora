"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { LayoutGrid, List, SlidersHorizontal, X, SearchX } from "lucide-react";
import { SearchBar } from "@/components/molecules/SearchBar";
import { ListingCard, ListingCardSkeleton } from "@/components/molecules/ListingCard";
import { Pagination } from "@/components/molecules/Pagination";
import { EmptyState } from "@/components/molecules/EmptyState";
import { Drawer } from "@/components/molecules/Modal";
import { FilterPanel } from "@/components/organisms/FilterPanel";
import { Button } from "@/components/atoms/Button";
import { useQueryParams } from "@/resources/hooks/useQueryParams";
import { SORT_OPTIONS } from "@/resources/utils/constant";
import { cn } from "@/resources/utils/cn";
import type { ListingCard as Card } from "@/server/services/catalog";

type Cat = { slug: string; name: string; icon: string; count: number };

export function ExploreTemplate({ items, total, page, pages, sort, categories, saved }: { items: Card[]; total: number; page: number; pages: number; sort: string; categories: Cat[]; saved: string[] }) {
  const { get, set, pending } = useQueryParams();
  const [view, setView] = useState<"grid" | "list">("grid");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const q = get("q");
  const activeCat = categories.find((c) => c.slug === get("category"));
  const heading = activeCat?.name ?? (get("type") === "service" ? "Book a service" : get("type") === "product" ? "Shop products" : q ? `Results for “${q}”` : "Explore the marketplace");

  const chips = [
    get("type") && { k: "type", l: get("type") === "product" ? "Products" : "Services" },
    activeCat && { k: "category", l: activeCat.name },
    get("city") && { k: "city", l: get("city") },
    get("minPrice") && { k: "minPrice", l: `From $${get("minPrice")}` },
    get("maxPrice") && { k: "maxPrice", l: `Up to $${get("maxPrice")}` },
    get("rating") && { k: "rating", l: `${get("rating")}★+` },
  ].filter(Boolean) as { k: string; l: string }[];

  return (
    <div className="pt-28 md:pt-32">
      <section className="container-x">
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="eyebrow">
          {total} {total === 1 ? "listing" : "listings"}
        </motion.p>
        <h1 className="display-lg mt-3 text-ink">{heading}</h1>
        <div className="mt-8 max-w-4xl">
          <SearchBar key={`${q}-${get("category")}-${get("city")}`} categories={categories} initial={{ q, category: get("category"), city: get("city") }} compact />
        </div>
      </section>

      <section className="container-x mt-12 grid gap-10 lg:grid-cols-[260px_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-28">
            <FilterPanel categories={categories} />
          </div>
        </aside>

        <div className="min-w-0">
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <Button variant="secondary" size="sm" className="lg:hidden" onClick={() => setFiltersOpen(true)}>
              <SlidersHorizontal className="size-4" /> Filters {chips.length > 0 && `(${chips.length})`}
            </Button>
            <div className="flex flex-1 flex-wrap gap-2">
              <AnimatePresence>
                {chips.map((c) => (
                  <motion.button key={c.k} layout initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} type="button" onClick={() => set({ [c.k]: null })} className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-3 py-1.5 text-[13px] font-semibold text-ink hover:bg-surface-3">
                    {c.l} <X className="size-3.5" aria-label={`Remove ${c.l}`} />
                  </motion.button>
                ))}
              </AnimatePresence>
            </div>
            <label className="flex h-10 items-center gap-2 rounded-full border border-line bg-surface pr-2 pl-4 text-sm">
              <span className="text-muted">Sort</span>
              <select value={sort} onChange={(e) => set({ sort: e.target.value === "relevance" ? null : e.target.value })} className="cursor-pointer bg-transparent font-semibold text-ink outline-none">
                {SORT_OPTIONS.filter((o) => o.value !== "relevance" || q).map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <div className="hidden rounded-full border border-line bg-surface p-1 sm:flex" role="group" aria-label="View">
              {(["grid", "list"] as const).map((v) => (
                <button key={v} type="button" onClick={() => setView(v)} aria-pressed={view === v} aria-label={`${v} view`} className={cn("relative grid size-8 place-items-center rounded-full transition", view === v ? "text-bg" : "text-muted hover:text-ink")}>
                  {view === v && <motion.span layoutId="view-pill" className="absolute inset-0 rounded-full bg-ink" />}
                  <span className="relative">{v === "grid" ? <LayoutGrid className="size-4" /> : <List className="size-4" />}</span>
                </button>
              ))}
            </div>
          </div>

          <div className={cn("transition-opacity duration-300", pending && "pointer-events-none opacity-50")} aria-busy={pending}>
            {items.length === 0 ? (
              <EmptyState icon={<SearchX />} title="Nothing matches yet" description="Try a broader search, remove a filter, or browse a different category." action={<Button variant="secondary" onClick={() => set({ q: null, type: null, category: null, minPrice: null, maxPrice: null, city: null, rating: null })}>Reset search</Button>} />
            ) : (
              <motion.div layout className={view === "grid" ? "grid gap-5 sm:grid-cols-2 xl:grid-cols-3" : "space-y-4"}>
                <AnimatePresence mode="popLayout">
                  {items.map((l, i) => (
                    <motion.div key={l._id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0, transition: { delay: Math.min(i, 8) * 0.04 } }} exit={{ opacity: 0, scale: 0.96 }}>
                      <ListingCard listing={l} saved={saved.includes(l._id)} layout={view} priority={i < 3} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </div>
          <Pagination page={page} pages={pages} className="mt-14" />
        </div>
      </section>

      <Drawer open={filtersOpen} onClose={() => setFiltersOpen(false)} title="Filters" side="left">
        <FilterPanel categories={categories} onApplied={() => setFiltersOpen(false)} />
      </Drawer>
    </div>
  );
}

export function ExploreSkeleton() {
  return (
    <div className="container-x pt-32">
      <div className="skeleton h-4 w-24" />
      <div className="skeleton mt-4 h-14 w-2/3 max-w-xl" />
      <div className="skeleton mt-8 h-16 max-w-4xl rounded-full" />
      <div className="mt-12 grid gap-10 lg:grid-cols-[260px_1fr]">
        <div className="hidden space-y-3 lg:block">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="skeleton h-9" />
          ))}
        </div>
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <ListingCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
