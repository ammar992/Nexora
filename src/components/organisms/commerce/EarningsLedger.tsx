"use client";

import { DataTable, type Column } from "@/components/organisms/dashboard/DataTable";
import { StatusBadge, Badge } from "@/components/atoms/Badge";
import { formatDate, formatMoney } from "@/resources/utils/format";

type Row = { _id: string; reference: string; kind: string; label: string; total: number; commission: number; vendorEarnings: number; currency: string; paymentStatus: string; paymentMethod: string; createdAt: string };

export function EarningsLedger({ data }: { data: { items: Row[]; total: number; page: number; pages: number } }) {
  const columns: Column<Row>[] = [
    { key: "date", header: "Date", cell: (r) => <span className="whitespace-nowrap text-muted">{formatDate(r.createdAt)}</span> },
    { key: "ref", header: "Reference", mobile: false, cell: (r) => <span className="font-semibold text-ink">{r.reference}</span> },
    { key: "what", header: "Sale", cell: (r) => <span className="flex items-center gap-2"><Badge>{r.kind}</Badge><span className="line-clamp-1 max-w-56">{r.label}</span></span> },
    { key: "method", header: "Method", cell: (r) => (r.paymentMethod === "manual" ? "Collected by you" : "Card") },
    { key: "status", header: "Payment", cell: (r) => <StatusBadge status={r.paymentStatus} /> },
    { key: "gross", header: "Gross", align: "right", cell: (r) => formatMoney(r.total, r.currency) },
    { key: "fee", header: "Commission", align: "right", cell: (r) => <span className="text-muted">−{formatMoney(r.commission, r.currency)}</span> },
    { key: "net", header: "You earn", align: "right", cell: (r) => <span className={r.paymentStatus === "refunded" ? "font-semibold text-muted line-through" : "font-semibold text-success"}>{formatMoney(r.vendorEarnings, r.currency)}</span> },
  ];
  return <DataTable columns={columns} rows={data.items} rowKey={(r) => r._id} page={data.page} pages={data.pages} total={data.total} empty="Paid sales will be listed here." mobileTitle={(r) => <p className="font-semibold">{r.reference}</p>} />;
}
