import Link from "next/link";
import { Users, Store, Boxes, Package, CalendarDays, Wallet, Percent, ArrowUpRight, UserPlus, ShoppingBag, CalendarCheck } from "lucide-react";
import { getAdminOverview } from "@/server/services/stats";
import { getSettings } from "@/server/services/settings";
import { PageHeader, Panel } from "@/components/organisms/dashboard/PageHeader";
import { RevenueChart, CountBars, Donut } from "@/components/organisms/dashboard/Charts";
import { StatCard } from "@/components/molecules/StatCard";
import { timeAgo } from "@/resources/utils/format";

export const metadata = { title: "Admin overview" };

const ICON: Record<string, React.ReactNode> = { order: <ShoppingBag />, booking: <CalendarCheck />, user: <UserPlus />, vendor: <Store /> };

export default async function AdminOverview() {
  const [data, settings] = await Promise.all([getAdminOverview(), getSettings()]);
  const t = data.totals;
  return (
    <>
      <PageHeader title="Platform overview" description="Everything happening across the marketplace." />
      {(t.pendingVendors > 0 || t.pendingListings > 0) && (
        <div className="mb-6 grid gap-3 sm:grid-cols-2">
          {t.pendingVendors > 0 && (
            <Link href="/admin/vendors?status=pending" className="group flex items-center justify-between rounded-3xl bg-warning-soft px-5 py-4 text-warning">
              <span className="font-semibold">{t.pendingVendors} vendor application{t.pendingVendors > 1 ? "s" : ""} to review</span>
              <ArrowUpRight className="size-5 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          )}
          {t.pendingListings > 0 && (
            <Link href="/admin/listings?status=pending" className="group flex items-center justify-between rounded-3xl bg-info-soft px-5 py-4 text-info">
              <span className="font-semibold">{t.pendingListings} listing{t.pendingListings > 1 ? "s" : ""} awaiting approval</span>
              <ArrowUpRight className="size-5 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          )}
        </div>
      )}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Gross volume (paid)" value={t.gmv} money icon={<Wallet />} tone="dark" />
        <StatCard label="Platform revenue" value={t.commission} money icon={<Percent />} tone="accent" hint={`${settings.commissionRate}% commission`} />
        <StatCard label="Users" value={t.users} icon={<Users />} />
        <StatCard label="Vendors" value={t.vendors} icon={<Store />} />
        <StatCard label="Live listings" value={t.listings} icon={<Boxes />} />
        <StatCard label="Orders" value={t.orders} icon={<Package />} />
        <StatCard label="Bookings" value={t.bookings} icon={<CalendarDays />} />
        <StatCard label="Pending reviews" value={t.pendingVendors + t.pendingListings} icon={<ArrowUpRight />} hint="Vendors + listings" />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Panel title="Revenue, last 12 months" className="xl:col-span-2">
          <RevenueChart data={data.series} primaryLabel="Gross volume" secondaryLabel="Commission" />
        </Panel>
        <Panel title="Recent activity" padded={false}>
          <ul className="divide-y divide-line">
            {data.activity.length === 0 && <li className="p-6 text-sm text-muted">No activity yet.</li>}
            {data.activity.map((a, i) => (
              <li key={i}>
                <Link href={a.href} className="flex items-start gap-3 px-5 py-3.5 hover:bg-surface-2/60">
                  <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-xl bg-surface-2 text-ink-soft [&_svg]:size-4">{ICON[a.kind]}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-ink">{a.title}</span>
                    <span className="block truncate text-[12px] text-muted">{a.detail}</span>
                  </span>
                  <span className="shrink-0 text-[11px] text-muted">{timeAgo(a.at)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Panel title="Paid transactions per month" className="xl:col-span-2">
          <CountBars data={data.series} />
        </Panel>
        <Panel title="Listing mix">
          <Donut data={data.listingMix} />
        </Panel>
      </div>
    </>
  );
}
