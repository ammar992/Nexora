import Link from "next/link";
import Image from "next/image";
import { Package, CalendarDays, Heart, Star, ArrowUpRight } from "lucide-react";
import { requirePageUser } from "@/server/auth/session";
import { getCustomerOverview } from "@/server/services/dashboard";
import { PageHeader, Panel } from "@/components/organisms/dashboard/PageHeader";
import { StatCard } from "@/components/molecules/StatCard";
import { StatusBadge } from "@/components/atoms/Badge";
import { ButtonLink } from "@/components/atoms/Button";
import { formatDate, formatMoney, formatTime } from "@/resources/utils/format";

export const metadata = { title: "My account" };

export default async function AccountOverview() {
  const user = await requirePageUser();
  const { counts, recentOrders, nextBookings } = await getCustomerOverview(user.id);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  return (
    <>
      <PageHeader title={`${greeting}, ${user.name.split(" ")[0]}`} description="Your orders, bookings and saved finds in one place." actions={<ButtonLink href="/explore" variant="dark">Explore marketplace</ButtonLink>} />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Orders" value={counts.orders} icon={<Package />} hint={`${counts.activeOrders} in progress`} tone="dark" />
        <StatCard label="Upcoming bookings" value={counts.upcoming} icon={<CalendarDays />} />
        <StatCard label="Saved" value={counts.saved} icon={<Heart />} />
        <StatCard label="Reviews written" value={counts.reviews} icon={<Star />} />
      </div>
      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <Panel title="Recent orders" action={<Link href="/account/orders" className="text-sm font-semibold text-accent">View all</Link>} padded={false}>
          {recentOrders.length === 0 ? (
            <p className="p-6 text-sm text-muted">No orders yet. <Link href="/explore?type=product" className="font-semibold text-accent">Browse products</Link></p>
          ) : (
            <ul className="divide-y divide-line">
              {recentOrders.map((o) => (
                <li key={o._id}>
                  <Link href={`/account/orders/${o._id}`} className="flex items-center gap-4 px-5 py-4 transition hover:bg-surface-2/60 md:px-6">
                    <span className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-surface-2">{o.items[0]?.image && <Image src={o.items[0].image} alt="" fill sizes="48px" className="object-cover" />}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-ink">{o.items.map((i) => i.title).join(", ")}</span>
                      <span className="text-[12px] text-muted">{o.reference} · {formatDate(o.createdAt)}</span>
                    </span>
                    <StatusBadge status={o.status} />
                    <span className="hidden text-sm font-semibold sm:block">{formatMoney(o.total, o.currency)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title="Coming up" action={<Link href="/account/bookings" className="text-sm font-semibold text-accent">View all</Link>} padded={false}>
          {nextBookings.length === 0 ? (
            <p className="p-6 text-sm text-muted">Nothing booked. <Link href="/explore?type=service" className="font-semibold text-accent">Find a service</Link></p>
          ) : (
            <ul className="divide-y divide-line">
              {nextBookings.map((b) => (
                <li key={b._id}>
                  <Link href={`/account/bookings/${b._id}`} className="flex items-center gap-4 px-5 py-4 transition hover:bg-surface-2/60 md:px-6">
                    <span className="grid w-14 shrink-0 place-items-center rounded-2xl bg-accent-soft py-2 text-center leading-tight">
                      <span className="text-[10px] font-bold text-accent uppercase">{new Date(`${b.date}T00:00:00`).toLocaleDateString("en-US", { month: "short" })}</span>
                      <span className="font-display text-xl text-ink">{b.date.slice(8)}</span>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-ink">{b.listingSnapshot?.title}</span>
                      <span className="text-[12px] text-muted">{formatTime(b.timeSlot)} · {(b.vendor as unknown as { storeName: string })?.storeName}</span>
                    </span>
                    <StatusBadge status={b.status} />
                    <ArrowUpRight className="size-4 text-muted" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}
