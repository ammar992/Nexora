"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Stagger, StaggerItem } from "@/components/atoms/Reveal";
import { SmartImage } from "@/components/atoms/SmartImage";
import { CategoryIcon } from "@/components/atoms/CategoryIcon";
import { cn } from "@/resources/utils/cn";
import type { CategoryWithCount } from "@/server/services/catalog";

/** Asymmetric bento of categories: two large image tiles, the rest as compact icon tiles. */
export function CategoryShowcase({ categories }: { categories: CategoryWithCount[] }) {
  const withImage = categories.filter((c) => c.image).slice(0, 2);
  const rest = categories.filter((c) => !withImage.includes(c)).slice(0, 6);
  return (
    <Stagger className="grid auto-rows-[180px] grid-cols-2 gap-3 md:auto-rows-[200px] md:grid-cols-6 md:gap-4">
      {withImage.map((c, i) => (
        <StaggerItem key={c.slug} className={cn("col-span-2 row-span-2", i === 0 ? "md:col-span-3" : "md:col-span-3 md:row-span-2")}>
          <Link href={`/explore?category=${c.slug}`} className="group relative block h-full overflow-hidden rounded-[28px] bg-surface-2">
            <SmartImage src={c.image} alt={c.name} fill sizes="(max-width:768px) 100vw, 50vw" className="transition-transform duration-[1200ms] ease-out group-hover:scale-105" />
            <span className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-6 text-white md:p-8">
              <div>
                <p className="text-[12px] font-semibold tracking-[0.14em] text-white/70 uppercase">{c.count} listings</p>
                <h3 className="mt-1 font-display text-3xl md:text-4xl">{c.name}</h3>
                {c.description && <p className="mt-1 hidden max-w-sm text-sm text-white/75 md:block">{c.description}</p>}
              </div>
              <span className="grid size-12 shrink-0 place-items-center rounded-full bg-white text-ink transition-transform duration-500 group-hover:rotate-45">
                <ArrowUpRight className="size-5" />
              </span>
            </div>
          </Link>
        </StaggerItem>
      ))}
      {rest.map((c) => (
        <StaggerItem key={c.slug} className="col-span-1 md:col-span-2">
          <Link href={`/explore?category=${c.slug}`} className="group flex h-full flex-col justify-between rounded-[28px] border border-line bg-surface p-5 transition-all duration-500 hover:-translate-y-1 hover:border-transparent hover:bg-ink hover:text-bg hover:shadow-lift md:p-6">
            <span className="grid size-11 place-items-center rounded-2xl bg-accent-soft text-accent transition-colors group-hover:bg-accent group-hover:text-accent-ink">
              <CategoryIcon name={c.icon} className="size-5" />
            </span>
            <span>
              <span className="block font-display text-xl leading-tight md:text-2xl">{c.name}</span>
              <span className="mt-1 block text-[13px] text-muted transition-colors group-hover:text-bg/60">{c.count} listing{c.count === 1 ? "" : "s"}</span>
            </span>
          </Link>
        </StaggerItem>
      ))}
    </Stagger>
  );
}
