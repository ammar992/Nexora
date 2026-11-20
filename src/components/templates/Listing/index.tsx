import Link from "next/link";
import { ChevronRight, MapPin, Clock, Globe, Check, ShieldCheck, Star, AlertTriangle } from "lucide-react";
import { Gallery } from "@/components/organisms/listing/Gallery";
import { PurchasePanel } from "@/components/organisms/listing/PurchasePanel";
import { BookingWidget } from "@/components/organisms/listing/BookingWidget";
import { Reviews } from "@/components/organisms/listing/Reviews";
import { AskVendor } from "@/components/organisms/listing/AskVendor";
import { FavoriteButton } from "@/components/molecules/FavoriteButton";
import { ListingCard } from "@/components/molecules/ListingCard";
import { SectionHeading } from "@/components/molecules/SectionHeading";
import { Avatar } from "@/components/atoms/Avatar";
import { Price } from "@/components/atoms/Price";
import { Stars } from "@/components/atoms/Stars";
import { Reveal } from "@/components/atoms/Reveal";
import { WEEKDAYS, type AvailabilityRules } from "@/resources/utils/slots";
import { formatTime } from "@/resources/utils/format";
import type { ListingDetail, ListingCard as Card, ListingReview } from "@/server/services/catalog";

type Vendor = { _id: string; storeName: string; slug: string; logo?: string; tagline?: string; description?: string; location?: { city?: string; country?: string }; rating?: number; reviewCount?: number; createdAt: string };

export function ListingTemplate({ listing, vendor, rules, providers, reviews, breakdown, related, saved, savedIds, blocked, canReview, existingReview, reviewReason }: {
  listing: ListingDetail; vendor: Vendor; rules: AvailabilityRules; providers: { id: string; label: string; description: string }[]; reviews: ListingReview[]; breakdown: Record<number, number>; related: Card[]; saved: boolean; savedIds: string[]; blocked?: string; canReview: boolean; existingReview: { rating: number; title: string; comment: string } | null; reviewReason?: string;
}) {
  const category = listing.category as unknown as { name: string; slug: string } | null;
  const isService = listing.type === "service";
  const place = listing.location?.remote ? "Online" : [listing.location?.city, listing.location?.country].filter(Boolean).join(", ");
  const since = new Date(vendor.createdAt).getFullYear();

  return (
    <div className="pt-24 md:pt-28">
      {listing.status !== "approved" && (
        <div className="container-x mb-4">
          <p className="flex items-center gap-2 rounded-2xl bg-warning-soft px-4 py-3 text-sm font-semibold text-warning">
            <AlertTriangle className="size-4" /> Preview: this listing is {listing.status}. Only you and admins can see it.
          </p>
        </div>
      )}
      <nav aria-label="Breadcrumb" className="container-x mb-6">
        <ol className="flex flex-wrap items-center gap-1 text-[13px] text-muted">
          <li><Link href="/explore" className="hover:text-ink">Explore</Link></li>
          {category && (
            <>
              <ChevronRight className="size-3.5" />
              <li><Link href={`/explore?category=${category.slug}`} className="hover:text-ink">{category.name}</Link></li>
            </>
          )}
          <ChevronRight className="size-3.5" />
          <li className="max-w-[50vw] truncate text-ink" aria-current="page">{listing.title}</li>
        </ol>
      </nav>

      <section className="container-x grid gap-10 lg:grid-cols-12 lg:gap-14">
        <div className="lg:col-span-7">
          <Gallery images={listing.images ?? []} title={listing.title} />
        </div>

        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-28">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="eyebrow">{isService ? "Service" : "Product"}{category ? ` · ${category.name}` : ""}</p>
                <h1 className="mt-3 font-display text-[2.4rem] leading-[1.05] tracking-tight text-ink md:text-5xl">{listing.title}</h1>
              </div>
              <FavoriteButton listingId={listing._id} initial={saved} variant="inline" className="shrink-0" />
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted">
              {listing.reviewCount > 0 && (
                <a href="#reviews" className="inline-flex items-center gap-1.5 hover:text-ink">
                  <Stars value={listing.rating} /> <span className="font-semibold text-ink">{listing.rating.toFixed(1)}</span> ({listing.reviewCount})
                </a>
              )}
              {place && (
                <span className="inline-flex items-center gap-1">
                  {listing.location?.remote ? <Globe className="size-4" /> : <MapPin className="size-4" />} {place}
                </span>
              )}
              {isService && listing.durationMinutes ? (
                <span className="inline-flex items-center gap-1">
                  <Clock className="size-4" /> {listing.durationMinutes} min
                </span>
              ) : null}
            </div>
            <div className="mt-6">
              <Price amount={listing.price} compareAt={listing.compareAtPrice ?? undefined} unit={listing.priceUnit} currency={listing.currency} size="lg" />
            </div>
            {listing.summary && <p className="mt-4 text-[17px] leading-relaxed text-ink-soft">{listing.summary}</p>}

            <div className="mt-8 rounded-[28px] border border-line bg-surface p-5 shadow-soft md:p-6">
              {isService ? (
                <BookingWidget listing={{ _id: listing._id, slug: listing.slug, title: listing.title, price: listing.price, priceUnit: listing.priceUnit, currency: listing.currency, durationMinutes: listing.durationMinutes ?? undefined }} rules={rules} providers={providers} disabled={blocked} />
              ) : (
                <PurchasePanel listing={{ _id: listing._id, slug: listing.slug, title: listing.title, image: listing.images?.[0]?.url ?? "", price: listing.price, stock: listing.stock, shippingFee: listing.shippingFee, currency: listing.currency, vendorName: vendor.storeName }} disabled={blocked} />
              )}
            </div>
            <p className="mt-4 flex items-center gap-2 text-[13px] text-muted">
              <ShieldCheck className="size-4 text-success" /> Payments are handled securely. Card details never touch our servers.
            </p>
          </div>
        </div>
      </section>

      <section className="container-x mt-20 grid gap-12 lg:grid-cols-12">
        <Reveal className="lg:col-span-7">
          <h2 className="font-display text-3xl text-ink">About this {isService ? "service" : "piece"}</h2>
          <div className="mt-5 space-y-4 text-[16px] leading-[1.75] text-ink-soft">
            {listing.description.split(/\n{2,}/).map((p, i) => (
              <p key={i} className="whitespace-pre-line">{p}</p>
            ))}
          </div>
          {listing.highlights?.length > 0 && (
            <ul className="mt-8 grid gap-3 sm:grid-cols-2">
              {listing.highlights.map((h) => (
                <li key={h} className="flex items-start gap-3 rounded-2xl bg-surface-2 p-4 text-sm text-ink">
                  <Check className="mt-0.5 size-4 shrink-0 text-accent" /> {h}
                </li>
              ))}
            </ul>
          )}
          {isService && (
            <div className="mt-8 rounded-3xl border border-line p-6">
              <h3 className="font-display text-xl text-ink">Availability</h3>
              <p className="mt-2 text-sm text-muted">
                {rules.days.map((d) => WEEKDAYS[d]).join(", ")} · {formatTime(rules.startTime)} to {formatTime(rules.endTime)} · book at least {rules.leadTimeHours} hours ahead, up to {rules.maxAdvanceDays} days out.
                {rules.capacityPerSlot > 1 && ` Up to ${rules.capacityPerSlot} people per slot.`}
              </p>
            </div>
          )}
          {listing.tags?.length > 0 && (
            <div className="mt-8 flex flex-wrap gap-2">
              {listing.tags.map((t) => (
                <Link key={t} href={`/explore?q=${encodeURIComponent(t)}`} className="rounded-full border border-line px-3 py-1 text-[13px] text-muted hover:border-ink hover:text-ink">
                  #{t}
                </Link>
              ))}
            </div>
          )}
        </Reveal>

        <Reveal className="lg:col-span-5" delay={0.1}>
          <div className="rounded-[28px] bg-ink p-7 text-bg">
            <p className="eyebrow !text-bg/50">Sold by</p>
            <Link href={`/vendors/${vendor.slug}`} className="mt-4 flex items-center gap-4">
              <Avatar name={vendor.storeName} src={vendor.logo} size={56} />
              <div>
                <p className="font-display text-2xl">{vendor.storeName}</p>
                <p className="text-sm text-bg/60">{[vendor.location?.city, vendor.location?.country].filter(Boolean).join(", ")} · since {since}</p>
              </div>
            </Link>
            {vendor.tagline && <p className="mt-5 font-display text-lg text-bg/85 italic">“{vendor.tagline}”</p>}
            {vendor.description && <p className="mt-3 line-clamp-4 text-sm leading-relaxed text-bg/65">{vendor.description}</p>}
            {(vendor.reviewCount ?? 0) > 0 && (
              <p className="mt-5 inline-flex items-center gap-1.5 text-sm">
                <Star className="size-4 text-accent" fill="currentColor" /> {vendor.rating?.toFixed(1)} across {vendor.reviewCount} reviews
              </p>
            )}
            <div className="mt-6 flex flex-wrap gap-3 [&_button]:!border-bg/20 [&_button]:!bg-transparent [&_button]:!text-bg">
              <AskVendor listingId={listing._id} slug={listing.slug} vendorName={vendor.storeName} />
              <Link href={`/vendors/${vendor.slug}`} className="inline-flex h-11 items-center rounded-full px-5 text-sm font-semibold text-bg/80 hover:text-bg">
                Visit storefront →
              </Link>
            </div>
          </div>
        </Reveal>
      </section>

      <div className="container-x mt-24">
        <Reviews listingId={listing._id} rating={listing.rating} count={listing.reviewCount} breakdown={breakdown} reviews={reviews as never} canReview={canReview} existing={existingReview} reason={reviewReason} />
      </div>

      {related.length > 0 && (
        <section className="container-x mt-28">
          <SectionHeading eyebrow="You might also like" title="More in this category" href={category ? `/explore?category=${category.slug}` : "/explore"} />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((l) => (
              <ListingCard key={l._id} listing={l} saved={savedIds.includes(l._id)} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
