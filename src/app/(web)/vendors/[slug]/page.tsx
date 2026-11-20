import { notFound } from "next/navigation";
import { MapPin, Star, Globe, CalendarDays } from "lucide-react";
import { getVendorStorefront, getFavoriteIds } from "@/server/services/catalog";
import { getCurrentUser } from "@/server/auth/session";
import { ListingCard } from "@/components/molecules/ListingCard";
import { EmptyState } from "@/components/molecules/EmptyState";
import { Avatar } from "@/components/atoms/Avatar";
import { SmartImage } from "@/components/atoms/SmartImage";
import { Stagger, StaggerItem, Reveal } from "@/components/atoms/Reveal";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getVendorStorefront(slug);
  return { title: data?.vendor.storeName ?? "Vendor", description: data?.vendor.tagline };
}

export default async function VendorStorefront({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [data, user] = await Promise.all([getVendorStorefront(slug), getCurrentUser()]);
  if (!data) notFound();
  const { vendor, listings } = data;
  const saved = await getFavoriteIds(user?.id);
  const cover = vendor.coverImage || listings[0]?.image;
  const products = listings.filter((l) => l.type === "product");
  const services = listings.filter((l) => l.type === "service");

  return (
    <div className="pt-24">
      <section className="container-x">
        <div className="relative h-56 overflow-hidden rounded-[36px] bg-surface-2 md:h-80">
          {cover && <SmartImage src={cover} alt="" fill priority sizes="100vw" />}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        </div>
        <Reveal className="relative -mt-14 flex flex-col gap-6 px-2 md:-mt-16 md:flex-row md:items-end md:justify-between md:px-8">
          <div className="flex items-end gap-5">
            <div className="rounded-full border-4 border-bg">
              <Avatar name={vendor.storeName} src={vendor.logo} size={112} />
            </div>
            <div className="pb-2">
              <h1 className="font-display text-4xl text-ink md:text-5xl">{vendor.storeName}</h1>
              <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
                {vendor.location?.city && <span className="inline-flex items-center gap-1"><MapPin className="size-4" /> {vendor.location.city}, {vendor.location.country}</span>}
                {vendor.reviewCount > 0 && <span className="inline-flex items-center gap-1"><Star className="size-4 text-accent" fill="currentColor" /> {vendor.rating.toFixed(1)} ({vendor.reviewCount})</span>}
                <span className="inline-flex items-center gap-1"><CalendarDays className="size-4" /> Since {new Date(vendor.createdAt).getFullYear()}</span>
              </p>
            </div>
          </div>
          {vendor.website && (
            <a href={vendor.website} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-2 self-start rounded-full border border-line px-4 py-2 text-sm font-semibold text-ink hover:border-ink md:self-auto">
              <Globe className="size-4" /> Website
            </a>
          )}
        </Reveal>
        {(vendor.tagline || vendor.description) && (
          <Reveal className="mt-10 grid gap-6 md:px-8 lg:grid-cols-12">
            {vendor.tagline && <p className="font-display text-3xl leading-snug text-ink italic lg:col-span-5">“{vendor.tagline}”</p>}
            {vendor.description && <p className="text-[17px] leading-relaxed text-muted lg:col-span-6 lg:col-start-7">{vendor.description}</p>}
          </Reveal>
        )}
      </section>

      <section className="container-x mt-20 space-y-16">
        {listings.length === 0 && <EmptyState title="No listings yet" description="This vendor hasn't published anything yet. Check back soon." />}
        {[{ title: "Products", items: products }, { title: "Services", items: services }].filter((g) => g.items.length).map((g) => (
          <div key={g.title}>
            <h2 className="mb-8 font-display text-3xl text-ink">{g.title} <span className="text-muted">({g.items.length})</span></h2>
            <Stagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {g.items.map((l) => (
                <StaggerItem key={l._id}>
                  <ListingCard listing={l} saved={saved.includes(l._id)} />
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        ))}
      </section>
    </div>
  );
}
