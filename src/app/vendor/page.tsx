import Link from "next/link";
import Image from "next/image";
import { Wallet, Package, CalendarDays, Boxes, Plus, Eye, Star } from "lucide-react";
import { requirePageUser } from "@/server/auth/session";
import { getVendorOverview } from "@/server/services/stats";
import { PageHeader, Panel } from "@/components/organisms/dashboard/PageHeader";
import { RevenueChart } from "@/components/organisms/dashboard/Charts";
import { StatCard } from "@/components/molecules/StatCard";
import { StatusBadge } from "@/components/atoms/Badge";
import { ButtonLink } from "@/components/atoms/Button";
import { formatDate, formatMoney, formatTime } from "@/resources/utils/format";

export const metadata = { title: "Vendor overview" };

export default async function VendorOverview() {
  const user = await requirePageUser();
  const data = await getVendorOverview(user.vendorId!);
  const t = data.totals;
  return (
    <>
      <PageHeader title="Studio overview" description="How your store is doing, and what needs your attention." actions={<ButtonLink href="/vendor/listings/new"><Plus className="size-4" /> New listing</ButtonLink>} />
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard label="Earnings (paid)" value={t.earnings} money icon={<Wallet />} tone="accent" hint={`${formatMoney(t.inProgress)} in progress`} />
        <StatCard label="Orders" value={t.orders} icon={<Package />} />
        <StatCard label="Bookings" value={t.bookings} icon={<CalendarDays />} />
        <StatCard label="Live listings" value={t.activeListings} icon={<Boxes />} hint={t.pendingListings ? `${t.pendingListings} awaiting review` : `${t.reviews} reviews`} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Panel title="Earnings, last 12 months" className="xl:col-span-2">
          <RevenueChart data={data.series} primaryLabel="Earnings" />
        </Panel>
        <Panel title="Upcoming bookings" action={<Link href="/vendor/bookings?when=upcoming" className="text-sm font-semibold text-accent">All</Link>} padded={false}>
          {data.upcoming.length === 0 ? (
            <p className="p-6 text-sm text-muted">No upcoming bookings.</p>
          ) : (
            <ul className="divide-y divide-line">
              {data.upcoming.map((b) => (
                <li key={b._id} className="flex items-center gap-3 px-5 py-3.5">
                  <span className="grid w-12 shrink-0 place-items-center rounded-xl bg-surface-2 py-1 text-center leading-tight">
                    <span className="text-[10px] font-bold text-accent uppercase">{new Date(`${b.date}T00:00:00`).toLocaleDateString("en-US", { month: "short" })}</span>
                    <span className="font-display text-lg">{b.date.slice(8)}</span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-ink">{b.listingSnapshot?.title}</span>
                    <span className="text-[12px] text-muted">{formatTime(b.timeSlot)} · {(b.customer as unknown as { name: string })?.name}</span>
                  </span>
                  <StatusBadge status={b.status} />
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Panel title="Recent orders" action={<Link href="/vendor/orders" className="text-sm font-semibold text-accent">All orders</Link>} padded={false}>
          {data.recentOrders.length === 0 ? (
            <p className="p-6 text-sm text-muted">No orders yet. Share your storefront to get your first sale.</p>
          ) : (
            <ul className="divide-y divide-line">
              {data.recentOrders.map((o) => (
                <li key={o._id}>
                  <Link href={`/vendor/orders?q=${o.reference}`} className="flex items-center gap-3 px-5 py-3.5 hover:bg-surface-2/60">
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-ink">{o.reference} · {(o.customer as unknown as { name: string })?.name}</span>
                      <span className="block truncate text-[12px] text-muted">{o.items.map((i) => `${i.quantity}× ${i.title}`).join(", ")} · {formatDate(o.createdAt)}</span>
                    </span>
                    <StatusBadge status={o.status} />
                    <span className="hidden text-sm font-semibold sm:block">{formatMoney(o.total, o.currency)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title="Top listings" action={<Link href="/vendor/listings" className="text-sm font-semibold text-accent">Manage</Link>} padded={false}>
          {data.topListings.length === 0 ? (
            <p className="p-6 text-sm text-muted">Create a listing to see how it performs.</p>
          ) : (
            <ul className="divide-y divide-line">
              {data.topListings.map((l) => (
                <li key={l._id} className="flex items-center gap-3 px-5 py-3.5">
                  <span className="relative size-11 shrink-0 overflow-hidden rounded-xl bg-surface-2">{l.images?.[0]?.url && <Image src={l.images[0].url} alt="" fill sizes="44px" className="object-cover" />}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-ink">{l.title}</span>
                    <span className="flex items-center gap-3 text-[12px] text-muted">
                      <span className="inline-flex items-center gap-1"><Eye className="size-3" />{l.views}</span>
                      <span>{l.salesCount} sold</span>
                      {l.rating > 0 && <span className="inline-flex items-center gap-1"><Star className="size-3" />{l.rating.toFixed(1)}</span>}
                    </span>
                  </span>
                  <StatusBadge status={l.status} />
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}
