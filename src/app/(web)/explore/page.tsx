import { ExploreTemplate } from "@/components/templates/Explore";
import { searchListings, getCategoriesWithCounts, getFavoriteIds, type SearchParams } from "@/server/services/catalog";
import { getCurrentUser } from "@/server/auth/session";

export const metadata = { title: "Explore", description: "Browse products and services from independent vendors." };

export default async function ExplorePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const user = await getCurrentUser();
  const [result, categories, saved] = await Promise.all([searchListings(params), getCategoriesWithCounts(), getFavoriteIds(user?.id)]);
  return (
    <ExploreTemplate
      items={result.items}
      total={result.total}
      page={result.page}
      pages={result.pages}
      sort={result.sort}
      categories={categories.map((c) => ({ slug: c.slug, name: c.name, icon: c.icon, count: c.count }))}
      saved={saved}
    />
  );
}
