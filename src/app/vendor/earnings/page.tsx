import { Wallet, Percent, Hourglass, TrendingUp } from "lucide-react";
import { requirePageUser } from "@/server/auth/session";
import { getVendorOverview } from "@/server/services/stats";
import { listVendorTransactions, type ListQuery } from "@/server/services/dashboard";
import { getSettings } from "@/server/services/settings";
import { PageHeader, Panel } from "@/components/organisms/dashboard/PageHeader";
import { RevenueChart } from "@/components/organisms/dashboard/Charts";
import { StatCard } from "@/components/molecules/StatCard";
import { EarningsLedger } from "@/components/organisms/commerce/EarningsLedger";

export const metadata = { title: "Earnings" };

export default async function VendorEarnings({ searchParams }: { searchParams: Promise<ListQuery> }) {
  const user = await requirePageUser();
  const [overview, ledger, settings] = await Promise.all([getVendorOverview(user.vendorId!), listVendorTransactions(user.vendorId!, await searchParams), getSettings()]);
  const t = overview.totals;
  return (
    <>
      <PageHeader title="Earnings" description={`Gross sales minus the ${settings.commissionRate}% platform commission. Card payments are settled by the marketplace; cash payments you collect directly.`} />
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard label="Net earnings" value={t.earnings} money icon={<Wallet />} tone="dark" />
        <StatCard label="Gross sales" value={t.gross} money icon={<TrendingUp />} />
        <StatCard label="Commission paid" value={t.commission} money icon={<Percent />} />
        <StatCard label="In progress" value={t.inProgress} money icon={<Hourglass />} hint="Paid, not yet delivered/completed" />
      </div>
      <Panel title="Monthly earnings" className="mt-6">
        <RevenueChart data={overview.series} primaryLabel="Earnings" secondaryLabel="Commission" />
      </Panel>
      <h2 className="mt-10 mb-4 font-display text-2xl text-ink">Ledger</h2>
      <EarningsLedger data={ledger} />
    </>
  );
}
