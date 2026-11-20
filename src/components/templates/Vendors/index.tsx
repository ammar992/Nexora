"use client";

import { useState } from "react";
import { Search, Store } from "lucide-react";
import { VendorCard } from "@/components/molecules/VendorCard";
import { Pagination } from "@/components/molecules/Pagination";
import { EmptyState } from "@/components/molecules/EmptyState";
import { Stagger, StaggerItem } from "@/components/atoms/Reveal";
import { ButtonLink } from "@/components/atoms/Button";
import { useQueryParams } from "@/resources/hooks/useQueryParams";
import type { FeaturedVendor } from "@/server/services/catalog";

export function VendorsTemplate({ items, total, page, pages, q }: { items: FeaturedVendor[]; total: number; page: number; pages: number; q: string }) {
  const { set, pending } = useQueryParams();
  const [value, setValue] = useState(q);
  return (
    <div className="container-x pt-28 md:pt-36">
      <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-7">
          <p className="eyebrow">{total} independent vendors</p>
          <h1 className="display-xl mt-4 text-ink">The people <em className="text-accent">behind it.</em></h1>
        </div>
        <form className="lg:col-span-5" onSubmit={(e) => { e.preventDefault(); set({ q: value.trim() || null }); }} role="search">
          <label className="flex h-14 items-center gap-3 rounded-full border border-line bg-surface px-5 focus-within:border-accent focus-within:shadow-[0_0_0_4px_var(--ring)]">
            <Search className="size-[18px] text-muted" />
            <span className="sr-only">Search vendors</span>
            <input value={value} onChange={(e) => setValue(e.target.value)} placeholder="Search by name or city" className="w-full bg-transparent outline-none" />
          </label>
        </form>
      </div>
      <div className={pending ? "mt-14 opacity-60 transition-opacity" : "mt-14 transition-opacity"}>
        {items.length === 0 ? (
          <EmptyState icon={<Store />} title="No vendors found" description="Try a different name or city." action={<ButtonLink href="/become-vendor">Become a vendor</ButtonLink>} />
        ) : (
          <Stagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((v) => (
              <StaggerItem key={v._id}>
                <VendorCard vendor={v} />
              </StaggerItem>
            ))}
          </Stagger>
        )}
      </div>
      <Pagination page={page} pages={pages} className="mt-14" />
    </div>
  );
}
