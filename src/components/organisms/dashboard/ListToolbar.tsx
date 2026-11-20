"use client";

import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import { Tabs } from "@/components/molecules/Tabs";
import { useQueryParams } from "@/resources/hooks/useQueryParams";
import { useDebounce } from "@/resources/hooks/useDebounce";
import { STATUS_META } from "@/resources/utils/constant";

/** Search box + status tabs, both stored in the URL (?q=&status=). */
export function ListToolbar({ statuses, counts, placeholder = "Search", param = "status", children, id = "list" }: { statuses?: string[]; counts?: Record<string, number>; placeholder?: string; param?: string; children?: React.ReactNode; id?: string }) {
  const { get, set } = useQueryParams();
  const [q, setQ] = useState(get("q"));
  const debounced = useDebounce(q, 400);
  useEffect(() => {
    if (debounced !== get("q")) set({ q: debounced || null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);
  const all = counts ? Object.values(counts).reduce((a, b) => a + b, 0) : undefined;
  const current = get(param);

  return (
    <div className="mb-6 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
      {statuses && (
        <Tabs
          id={id}
          value={current || "all"}
          onChange={(v) => set({ [param]: v === "all" ? null : v })}
          items={[{ value: "all", label: "All", count: all }, ...statuses.map((s) => ({ value: s, label: STATUS_META[s]?.label ?? s, count: counts?.[s] ?? (counts ? 0 : undefined) }))]}
        />
      )}
      <div className="flex flex-wrap items-center gap-2">
        {children}
        <label className="flex h-11 w-full items-center gap-2 rounded-full border border-line bg-surface px-4 focus-within:border-accent focus-within:shadow-[0_0_0_4px_var(--ring)] sm:w-72">
          <Search className="size-4 shrink-0 text-muted" />
          <span className="sr-only">{placeholder}</span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={placeholder} className="w-full min-w-0 bg-transparent text-sm outline-none" />
          {q && (
            <button type="button" onClick={() => setQ("")} aria-label="Clear search" className="text-muted hover:text-ink">
              <X className="size-4" />
            </button>
          )}
        </label>
      </div>
    </div>
  );
}

export function FilterSelect({ param, label, options }: { param: string; label: string; options: { value: string; label: string }[] }) {
  const { get, set } = useQueryParams();
  return (
    <label className="flex h-11 items-center gap-2 rounded-full border border-line bg-surface pr-3 pl-4 text-sm">
      <span className="text-muted">{label}</span>
      <select value={get(param)} onChange={(e) => set({ [param]: e.target.value || null })} className="cursor-pointer bg-transparent font-semibold text-ink outline-none">
        <option value="">All</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
