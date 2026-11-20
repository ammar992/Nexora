import { HomeTemplate } from "@/components/templates/Home";
import {
  getCategoriesWithCounts, getFeaturedListings, getTrendingListings, getFeaturedVendors, getHomeTestimonials, getMarketplaceStats, getFavoriteIds,
} from "@/server/services/catalog";
import { getSettings } from "@/server/services/settings";
import { getCurrentUser } from "@/server/auth/session";

export default async function HomePage() {
  const user = await getCurrentUser();
  const [settings, categories, featured, products, services, vendors, testimonials, stats, saved] = await Promise.all([
    getSettings(),
    getCategoriesWithCounts(),
    getFeaturedListings(8),
    getTrendingListings("product", 8),
    getTrendingListings("service", 8),
    getFeaturedVendors(6),
    getHomeTestimonials(5),
    getMarketplaceStats(),
    getFavoriteIds(user?.id),
  ]);
  return (
    <HomeTemplate
      hero={settings.homepage}
      commission={settings.commissionRate}
      categories={categories}
      featured={featured}
      products={products}
      services={services}
      vendors={vendors}
      testimonials={testimonials}
      stats={stats}
      saved={saved}
    />
  );
}
