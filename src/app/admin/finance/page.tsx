import Link from "next/link";
import { Wallet, Percent, Store, Clock } from "lucide-react";
import { getFinanceSummary } from "@/server/services/stats";
import { listPayments, type ListQuery } from "@/server/services/dashboard";
import { getSettings } from "@/server/services/settings";
import { PageHeader, Panel } from "@/components/organisms/dashboard/PageHeader";
import { RevenueChart } from "@/components/organisms/dashboard/Charts";
import { StatCard } from "@/components/molecules/StatCard";
import { PaymentsTable } from "@/components/organisms/commerce/PaymentsTable";
import { formatMoney } from "@/resources/utils/format";

export const metadata = { title: "Finance" };

export default async function AdminFinance({ searchParams }: { searchParams: Promise<ListQuery> }) {
  const [f, payments, settings] = await Promise.all([getFinanceSummary(), listPayments({}, await searchParams), getSettings()]);
  const pending = f.byStatus.pending ?? { n: 0, amount: 0 };
  return (
    <>
      <PageHeader title="Finance" description={`Transactions, commission and vendor earnings. Current commission rate: ${settings.commissionRate}% (change it in Settings).`} />
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard label="Gross volume" value={f.gmv} money icon={<Wallet />} tone="dark" />
        <StatCard label="Commission earned" value={f.commission} money icon={<Percent />} tone="accent" />
        <StatCard label="Owed to vendors" value={f.vendorEarnings} money icon={<Store />} />
        <StatCard label="Pending payments" value={pending.amount} money icon={<Clock />} hint={`${pending.n} awaiting payment`} />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Panel title="Revenue & commission" className="xl:col-span-2">
          <RevenueChart data={f.series} primaryLabel="Gross" secondaryLabel="Commission" />
        </Panel>
        <Panel title="By payment method">
          <ul className="space-y-4">
            {f.byProvider.length === 0 && <li className="text-sm text-muted">No paid transactions yet.</li>}
            {f.byProvider.map((p) => (
              <li key={p.provider} className="flex items-center justify-between">
                <span className="text-sm text-ink-soft">{p.provider === "manual" ? "Offline (on delivery / in person)" : "Card (Stripe)"}<span className="block text-[12px] text-muted">{p.n} payments</span></span>
                <span className="font-display text-xl">{formatMoney(p.amount)}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
      <Panel title="Vendor earnings" className="mt-6" padded={false}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead><tr className="border-b border-line text-[11px] font-bold tracking-[0.1em] text-muted uppercase"><th className="px-6 py-3">Vendor</th><th className="px-6 py-3 text-right">Gross</th><th className="px-6 py-3 text-right">Commission</th><th className="px-6 py-3 text-right">Earnings</th></tr></thead>
            <tbody>
              {f.vendorEarningsTable.length === 0 && <tr><td colSpan={4} className="px-6 py-6 text-muted">No paid sales yet.</td></tr>}
              {f.vendorEarningsTable.map((v) => (
                <tr key={v.vendorId} className="border-b border-line last:border-0">
                  <td className="px-6 py-3.5 font-semibold"><Link href={`/vendors/${v.slug}`} className="hover:text-accent">{v.storeName}</Link></td>
                  <td className="px-6 py-3.5 text-right">{formatMoney(v.gross)}</td>
                  <td className="px-6 py-3.5 text-right text-muted">{formatMoney(v.commission)}</td>
                  <td className="px-6 py-3.5 text-right font-semibold text-success">{formatMoney(v.earnings)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      <h2 className="mt-10 mb-4 font-display text-2xl text-ink">Transactions</h2>
      <PaymentsTable data={payments as never} admin />
    </>
  );
}
