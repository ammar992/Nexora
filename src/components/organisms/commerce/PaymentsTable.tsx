"use client";

import { DataTable, type Column } from "@/components/organisms/dashboard/DataTable";
import { ListToolbar } from "@/components/organisms/dashboard/ListToolbar";
import { StatusBadge } from "@/components/atoms/Badge";
import { formatDateTime, formatMoney } from "@/resources/utils/format";

export type PaymentRow = {
  _id: string;
  reference: string;
  kind: "order" | "booking";
  provider: string;
  amount: number;
  commission: number;
  currency: string;
  status: string;
  createdAt: string;
  paidAt?: string;
  customer: { name: string; email: string } | null;
  orders?: { reference: string }[];
  booking?: { reference: string; listingSnapshot?: { title: string } } | null;
};

export function PaymentsTable({ data, admin }: { data: { items: PaymentRow[]; total: number; page: number; pages: number }; admin?: boolean }) {
  const columns: Column<PaymentRow>[] = [
    { key: "ref", header: "Payment", mobile: false, cell: (p) => <span className="font-semibold text-ink">{p.reference}</span> },
    { key: "for", header: "For", cell: (p) => <span className="text-muted">{p.kind === "order" ? `Order ${p.orders?.map((o) => o.reference).join(", ")}` : `Booking ${p.booking?.reference ?? ""}`}</span> },
    ...(admin ? [{ key: "customer", header: "Customer", cell: (p: PaymentRow) => p.customer?.name ?? "—" }] : []),
    { key: "method", header: "Method", cell: (p) => (p.provider === "manual" ? "On delivery / in person" : "Card (Stripe)") },
    { key: "date", header: "Date", cell: (p) => <span className="whitespace-nowrap text-muted">{formatDateTime(p.paidAt ?? p.createdAt)}</span> },
    { key: "status", header: "Status", cell: (p) => <StatusBadge status={p.status === "pending" ? "unpaid" : p.status} /> },
    ...(admin ? [{ key: "fee", header: "Commission", align: "right" as const, cell: (p: PaymentRow) => formatMoney(p.commission, p.currency) }] : []),
    { key: "amount", header: "Amount", align: "right", cell: (p) => <span className="font-semibold">{formatMoney(p.amount, p.currency)}</span> },
  ];
  return (
    <>
      <ListToolbar statuses={["pending", "paid", "refunded", "cancelled", "failed"]} placeholder="Search payment reference" id="payments" />
      <DataTable columns={columns} rows={data.items} rowKey={(p) => p._id} page={data.page} pages={data.pages} total={data.total} empty="No payments yet." mobileTitle={(p) => <p className="font-semibold">{p.reference}</p>} />
    </>
  );
}
