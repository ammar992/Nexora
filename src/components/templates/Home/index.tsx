import { Hero } from "@/components/organisms/home/Hero";
import { CategoryShowcase } from "@/components/organisms/home/CategoryShowcase";
import { HowItWorks } from "@/components/organisms/home/HowItWorks";
import { TrendingTabs } from "@/components/organisms/home/TrendingTabs";
import { Testimonials } from "@/components/organisms/home/Testimonials";
import { Newsletter } from "@/components/organisms/home/Newsletter";
import { VendorPromo } from "@/components/organisms/home/VendorPromo";
import { SectionHeading } from "@/components/molecules/SectionHeading";
import { ListingCard } from "@/components/molecules/ListingCard";
import { VendorCard } from "@/components/molecules/VendorCard";
import { EmptyState } from "@/components/molecules/EmptyState";
import { ButtonLink } from "@/components/atoms/Button";
import { Stagger, StaggerItem } from "@/components/atoms/Reveal";
import type { CategoryWithCount, FeaturedVendor, ListingCard as Card } from "@/server/services/catalog";
import { Store } from "lucide-react";

type Props = {
  hero: { heroEyebrow?: string | null; heroTitle?: string | null; heroSubtitle?: string | null; promoTitle?: string | null; promoText?: string | null; promoCta?: string | null } | null | undefined;
  commission: number;
  categories: CategoryWithCount[];
  featured: Card[];
  products: Card[];
  services: Card[];
  vendors: FeaturedVendor[];
  testimonials: Parameters<typeof Testimonials>[0]["items"];
  stats: { listings: number; vendors: number; reviews: number; cities: number };
  saved: string[];
};

export function HomeTemplate({ hero, commission, categories, featured, products, services, vendors, testimonials, stats, saved }: Props) {
  const product = products[0] ?? featured.find((f) => f.type === "product") ?? null;
  const service = services[0] ?? featured.find((f) => f.type === "service") ?? null;
  const spot = (c: Card | null) => (c ? { title: c.title, slug: c.slug, price: c.price, currency: c.currency, type: c.type, rating: c.rating } : null);
  const promoImages = [services[0]?.image, products[1]?.image ?? products[0]?.image].filter(Boolean) as string[];
  const empty = featured.length === 0;

  return (
    <>
      <Hero
        eyebrow={hero?.heroEyebrow ?? ""}
        title={hero?.heroTitle ?? "Things worth keeping. People worth booking."}
        subtitle={hero?.heroSubtitle ?? ""}
        categories={categories.map((c) => ({ slug: c.slug, name: c.name }))}
        product={spot(product)}
        service={spot(service)}
        stats={stats}
      />

      {/* Category marquee */}
      {categories.length > 0 && (
        <div className="overflow-hidden border-y border-line bg-surface py-5" aria-hidden>
          <div className="flex w-max animate-marquee gap-12 whitespace-nowrap">
            {[...categories, ...categories].map((c, i) => (
              <span key={i} className="flex items-center gap-12 font-display text-2xl text-ink-soft italic md:text-3xl">
                {c.name}
                <span className="size-2 rounded-full bg-accent" />
              </span>
            ))}
          </div>
        </div>
      )}

      {empty ? (
        <section className="container-x py-24">
          <EmptyState
            icon={<Store />}
            title="The marketplace is getting ready"
            description="No listings are live yet. Approved vendors' products and services will appear here. Run `npm run seed:demo` to load sample data."
            action={<ButtonLink href="/become-vendor">Become the first vendor</ButtonLink>}
          />
        </section>
      ) : (
        <>
          <section className="container-x py-24 md:py-32">
            <SectionHeading eyebrow="Browse by category" title="Start with what you're after." href="/explore" linkLabel="All categories" />
            <CategoryShowcase categories={categories} />
          </section>

          <section className="container-x pb-24 md:pb-32">
            <SectionHeading eyebrow="Featured" title={<>Picked by our team <em className="text-accent italic">this week</em></>} description="Listings our curators keep coming back to, from small-batch homeware to the photographers people rebook." href="/explore?sort=rating" />
            <Stagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {featured.slice(0, 8).map((l, i) => (
                <StaggerItem key={l._id}>
                  <ListingCard listing={l} saved={saved.includes(l._id)} priority={i < 2} />
                </StaggerItem>
              ))}
            </Stagger>
          </section>
        </>
      )}

      <HowItWorks />

      {!empty && (
        <section className="container-x py-24 md:py-32">
          <SectionHeading eyebrow="Trending now" title="What people are ordering and booking." href="/explore?sort=popular" />
          <TrendingTabs products={products} services={services} saved={saved} />
        </section>
      )}

      {vendors.length > 0 && (
        <section className="border-y border-line bg-surface py-24 md:py-32">
          <div className="container-x">
            <SectionHeading eyebrow="Featured vendors" title="The people behind the work." description="Every storefront is reviewed before it opens. These are a few customers rate highest." href="/vendors" linkLabel="Meet all vendors" />
            <Stagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {vendors.map((v) => (
                <StaggerItem key={v._id}>
                  <VendorCard vendor={v} />
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </section>
      )}

      {testimonials.length > 0 && (
        <section className="container-x py-24 md:py-32">
          <SectionHeading eyebrow="From verified customers" title="Reviews only come from real orders." align="left" />
          <Testimonials items={testimonials} />
        </section>
      )}

      <div className="py-8 md:py-12">
        <VendorPromo title={hero?.promoTitle ?? "Open your studio"} text={hero?.promoText ?? ""} cta={hero?.promoCta ?? "Apply to sell"} images={promoImages} commission={commission} />
      </div>

      <div className="pt-16 md:pt-24">
        <Newsletter />
      </div>
    </>
  );
}
