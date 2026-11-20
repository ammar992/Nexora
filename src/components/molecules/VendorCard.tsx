import Link from "next/link";
import { MapPin, Star } from "lucide-react";
import { SmartImage } from "@/components/atoms/SmartImage";
import { Avatar } from "@/components/atoms/Avatar";
import type { FeaturedVendor } from "@/server/services/catalog";

export function VendorCard({ vendor }: { vendor: FeaturedVendor }) {
  const previews = vendor.previews.filter((p) => p.url).slice(0, 3);
  return (
    <Link href={`/vendors/${vendor.slug}`} className="group block rounded-[28px] border border-line bg-surface p-3 transition-all duration-500 hover:-translate-y-1 hover:shadow-lift">
      <div className="grid h-44 grid-cols-3 grid-rows-2 gap-1.5 overflow-hidden rounded-[22px]">
        {previews.length === 0 && <div className="col-span-3 row-span-2 bg-surface-2" />}
        {previews.map((p, i) => (
          <div key={i} className={i === 0 ? "relative col-span-2 row-span-2 overflow-hidden" : "relative overflow-hidden"} style={previews.length === 2 && i === 1 ? { gridRow: "span 2" } : undefined}>
            <SmartImage src={p.url} alt={p.title} fill sizes="240px" className="transition-transform duration-700 group-hover:scale-105" />
          </div>
        ))}
      </div>
      <div className="flex items-center gap-3 px-2 pt-4 pb-2">
        <Avatar name={vendor.storeName} src={vendor.logo} size={44} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-lg text-ink">{vendor.storeName}</p>
          <p className="flex items-center gap-2 text-[13px] text-muted">
            {vendor.city && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3" /> {vendor.city}
              </span>
            )}
            <span>{vendor.listingCount} listings</span>
          </p>
        </div>
        {vendor.reviewCount > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-2.5 py-1 text-[13px] font-semibold text-ink">
            <Star className="size-3.5 text-accent" fill="currentColor" /> {vendor.rating.toFixed(1)}
          </span>
        )}
      </div>
    </Link>
  );
}
