import { Heart } from "lucide-react";
import { requirePageUser } from "@/server/auth/session";
import { getSavedListings } from "@/server/services/dashboard";
import { getListingCardsByIds } from "@/server/services/catalog";
import { PageHeader } from "@/components/organisms/dashboard/PageHeader";
import { ListingCard } from "@/components/molecules/ListingCard";
import { EmptyState } from "@/components/molecules/EmptyState";
import { ButtonLink } from "@/components/atoms/Button";

export const metadata = { title: "Saved" };

export default async function SavedPage() {
  const user = await requirePageUser();
  const ids = await getSavedListings(user.id);
  const items = await getListingCardsByIds(ids);
  return (
    <>
      <PageHeader title="Saved" description={`${items.length} listing${items.length === 1 ? "" : "s"} you're keeping an eye on.`} />
      {items.length === 0 ? (
        <EmptyState icon={<Heart />} title="Nothing saved yet" description="Tap the heart on any listing to keep it here." action={<ButtonLink href="/explore">Explore</ButtonLink>} />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {items.map((l) => (
            <ListingCard key={l._id} listing={l} saved />
          ))}
        </div>
      )}
    </>
  );
}
