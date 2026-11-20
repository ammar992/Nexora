"use client";

import Link from "next/link";
import { MapPin, Clock, Globe } from "lucide-react";
import { Tilt } from "@/components/atoms/Tilt";
import { SmartImage } from "@/components/atoms/SmartImage";
import { Stars } from "@/components/atoms/Stars";
import { Price } from "@/components/atoms/Price";
import { FavoriteButton } from "./FavoriteButton";
import { cn } from "@/resources/utils/cn";
import type { ListingCard as ListingCardData } from "@/server/services/catalog";

export function ListingCard({ listing, saved = false, layout = "grid", priority = false }: { listing: ListingCardData; saved?: boolean; layout?: "grid" | "list"; priority?: boolean }) {
  const soldOut = listing.type === "product" && listing.stock <= 0;
  const place = listing.location.remote ? "Online" : listing.location.city;

  if (layout === "list") {
    return (
      <Link href={`/listing/${listing.slug}`} className="group flex gap-4 rounded-3xl border border-line bg-surface p-3 transition-[box-shadow,border-color] duration-300 hover:border-line-strong hover:shadow-lift sm:gap-6">
        <div className="relative aspect-square w-28 shrink-0 overflow-hidden rounded-2xl sm:w-44">
          <SmartImage src={listing.image} alt={listing.imageAlt} fill sizes="176px" className="transition-transform duration-[900ms] ease-out group-hover:scale-[1.06]" />
        </div>
        <div className="flex min-w-0 flex-1 flex-col py-1 pr-2">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="eyebrow mb-1">{listing.category?.name ?? (listing.type === "service" ? "Service" : "Product")}</p>
              <h3 className="line-clamp-2 font-display text-lg leading-snug text-ink sm:text-xl">{listing.title}</h3>
            </div>
            <FavoriteButton listingId={listing._id} initial={saved} variant="inline" className="size-9 shrink-0" />
          </div>
          <p className="mt-1 line-clamp-2 hidden text-sm text-muted sm:block">{listing.summary}</p>
          <div className="mt-auto flex flex-wrap items-end justify-between gap-2 pt-3">
            <div className="flex items-center gap-3 text-[13px] text-muted">
              {listing.reviewCount > 0 && (
                <span className="inline-flex items-center gap-1.5">
                  <Stars value={listing.rating} size={12} /> {listing.rating.toFixed(1)}
                </span>
              )}
              {place && (
                <span className="inline-flex items-center gap-1">
                  {listing.location.remote ? <Globe className="size-3.5" /> : <MapPin className="size-3.5" />} {place}
                </span>
              )}
            </div>
            <Price amount={listing.price} compareAt={listing.compareAtPrice} unit={listing.priceUnit} currency={listing.currency} />
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Tilt className="h-full" max={5}>
      <Link
        href={`/listing/${listing.slug}`}
        className="group flex h-full flex-col overflow-hidden rounded-[28px] border border-line bg-surface shadow-soft transition-[box-shadow,border-color] duration-500 hover:border-line-strong hover:shadow-lift"
      >
        <div className="relative aspect-[4/5] overflow-hidden bg-surface-2">
          <SmartImage
            src={listing.image}
            alt={listing.imageAlt}
            fill
            priority={priority}
            sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 25vw"
            className="transition-transform duration-[1100ms] ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:scale-[1.07]"
          />
          <span className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/35 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
            <span className="glass rounded-full px-2.5 py-1 text-[11px] font-bold tracking-wide text-ink uppercase">{listing.type === "service" ? "Book" : "Shop"}</span>
            {listing.featured && <span className="rounded-full bg-accent px-2.5 py-1 text-[11px] font-bold tracking-wide text-accent-ink uppercase">Featured</span>}
            {soldOut && <span className="rounded-full bg-ink px-2.5 py-1 text-[11px] font-bold tracking-wide text-bg uppercase">Sold out</span>}
          </div>
          <FavoriteButton listingId={listing._id} initial={saved} className="absolute top-3 right-3" />
          {listing.vendor && (
            <span className="glass absolute bottom-3 left-3 max-w-[75%] translate-y-2 truncate rounded-full px-3 py-1.5 text-xs font-semibold text-ink opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
              by {listing.vendor.storeName}
            </span>
          )}
        </div>
        <div className="flex flex-1 flex-col p-5">
          <div className="mb-1.5 flex items-center justify-between gap-2 text-[12px] text-muted">
            <span className="truncate">{listing.category?.name}</span>
            {place && (
              <span className="inline-flex shrink-0 items-center gap-1">
                {listing.type === "service" ? <Clock className="size-3" /> : <MapPin className="size-3" />}
                {place}
              </span>
            )}
          </div>
          <h3 className="line-clamp-2 font-display text-[1.2rem] leading-snug text-ink">{listing.title}</h3>
          <div className="mt-auto flex items-end justify-between gap-2 pt-4">
            <Price amount={listing.price} compareAt={listing.compareAtPrice} unit={listing.priceUnit} currency={listing.currency} />
            <span className={cn("inline-flex items-center gap-1 text-[13px] text-muted", listing.reviewCount === 0 && "opacity-0")}>
              <Stars value={listing.rating} size={12} />
              <span className="font-semibold text-ink-soft">{listing.rating.toFixed(1)}</span>
            </span>
          </div>
        </div>
      </Link>
    </Tilt>
  );
}

export function ListingCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-[28px] border border-line bg-surface">
      <div className="skeleton aspect-[4/5] rounded-none" />
      <div className="space-y-3 p-5">
        <div className="skeleton h-3 w-1/3" />
        <div className="skeleton h-5 w-4/5" />
        <div className="skeleton h-5 w-1/4" />
      </div>
    </div>
  );
}
