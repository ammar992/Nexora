"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { useQueryParams } from "@/resources/hooks/useQueryParams";
import { CategoryIcon } from "@/components/atoms/CategoryIcon";
import { Button } from "@/components/atoms/Button";
import { cn } from "@/resources/utils/cn";

type Cat = { slug: string; name: string; icon: string; count: number };

const RATINGS = [4.5, 4, 3];

/** Explore filters. Text inputs apply on blur / Enter; choices apply immediately. Everything lives in the URL. */
export function FilterPanel({ categories, onApplied }: { categories: Cat[]; onApplied?: () => void }) {
  const { get, set } = useQueryParams();
  const [min, setMin] = useState(get("minPrice"));
  const [max, setMax] = useState(get("maxPrice"));
  const [city, setCity] = useState(get("city"));
  // Reset the text inputs when the URL changes (e.g. "Clear all" or a removed chip).
  const urlSig = `${get("minPrice")}|${get("maxPrice")}|${get("city")}`;
  const [seenSig, setSeenSig] = useState(urlSig);
  if (urlSig !== seenSig) {
    setSeenSig(urlSig);
    setMin(get("minPrice"));
    setMax(get("maxPrice"));
    setCity(get("city"));
  }

  const apply = (u: Record<string, string | null>) => {
    set(u);
    onApplied?.();
  };
  const type = get("type");
  const category = get("category");
  const rating = get("rating");
  const anyActive = ["type", "category", "minPrice", "maxPrice", "city", "rating"].some((k) => get(k));

  const pill = (active: boolean) => cn("rounded-full border px-3.5 py-2 text-[13px] font-semibold transition", active ? "border-ink bg-ink text-bg" : "border-line bg-surface text-ink-soft hover:border-line-strong");

  return (
    <div className="space-y-8">
      <fieldset>
        <legend className="eyebrow mb-3">Type</legend>
        <div className="flex flex-wrap gap-2">
          {[{ v: "", l: "Everything" }, { v: "product", l: "Products" }, { v: "service", l: "Services" }].map((o) => (
            <button key={o.v} type="button" className={pill(type === o.v)} onClick={() => apply({ type: o.v || null })} aria-pressed={type === o.v}>
              {o.l}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="eyebrow mb-3">Category</legend>
        <ul className="space-y-0.5">
          {categories.map((c) => {
            const active = category === c.slug;
            return (
              <li key={c.slug}>
                <button type="button" onClick={() => apply({ category: active ? null : c.slug })} aria-pressed={active} className={cn("flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left text-sm transition", active ? "bg-accent-soft font-semibold text-accent" : "text-ink-soft hover:bg-surface-2")}>
                  <CategoryIcon name={c.icon} className="size-4 shrink-0" />
                  <span className="flex-1 truncate">{c.name}</span>
                  <span className="text-[12px] text-muted">{c.count}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </fieldset>

      <fieldset>
        <legend className="eyebrow mb-3">Price</legend>
        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            apply({ minPrice: min || null, maxPrice: max || null });
          }}
        >
          {[
            { v: min, s: setMin, p: "Min", l: "Minimum price" },
            { v: max, s: setMax, p: "Max", l: "Maximum price" },
          ].map((f, i) => (
            <label key={i} className="flex h-11 min-w-0 flex-1 items-center gap-1 rounded-xl border border-line bg-surface px-3 focus-within:border-accent">
              <span className="text-sm text-muted">$</span>
              <span className="sr-only">{f.l}</span>
              <input inputMode="numeric" value={f.v} onChange={(e) => f.s(e.target.value.replace(/[^\d]/g, ""))} onBlur={() => apply({ minPrice: min || null, maxPrice: max || null })} placeholder={f.p} className="w-full min-w-0 bg-transparent text-sm outline-none" />
            </label>
          ))}
        </form>
      </fieldset>

      <fieldset>
        <legend className="eyebrow mb-3">Location</legend>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            apply({ city: city.trim() || null });
          }}
        >
          <label className="flex h-11 items-center rounded-xl border border-line bg-surface px-3 focus-within:border-accent">
            <span className="sr-only">City</span>
            <input value={city} onChange={(e) => setCity(e.target.value)} onBlur={() => city !== get("city") && apply({ city: city.trim() || null })} placeholder="City, e.g. Lisbon" className="w-full bg-transparent text-sm outline-none" />
          </label>
        </form>
      </fieldset>

      <fieldset>
        <legend className="eyebrow mb-3">Rating</legend>
        <div className="flex flex-wrap gap-2">
          {RATINGS.map((r) => (
            <button key={r} type="button" className={pill(rating === String(r))} onClick={() => apply({ rating: rating === String(r) ? null : String(r) })} aria-pressed={rating === String(r)}>
              {r}★ & up
            </button>
          ))}
        </div>
      </fieldset>

      {anyActive && (
        <Button variant="ghost" size="sm" onClick={() => apply({ type: null, category: null, minPrice: null, maxPrice: null, city: null, rating: null })}>
          <X className="size-4" /> Clear all filters
        </Button>
      )}
    </div>
  );
}
