"use client";

import { Mail } from "lucide-react";
import { DataTable, type Column } from "@/components/organisms/dashboard/DataTable";
import { ListToolbar } from "@/components/organisms/dashboard/ListToolbar";
import { Avatar } from "@/components/atoms/Avatar";
import { formatDate, formatMoney } from "@/resources/utils/format";

type Row = { id: string; name: string; email: string; phone: string; avatar: string; orders: number; bookings: number; spent: number; last: string };

export function CustomersTable({ data }: { data: { items: Row[]; total: number; page: number; pages: number } }) {
  const columns: Column<Row>[] = [
    { key: "name", header: "Customer", mobile: false, cell: (r) => <span className="flex items-center gap-3"><Avatar name={r.name} src={r.avatar} size={36} /><span><span className="block font-semibold text-ink">{r.name}</span><span className="text-[12px] text-muted">{r.email}</span></span></span> },
    { key: "orders", header: "Orders", cell: (r) => r.orders },
    { key: "bookings", header: "Bookings", cell: (r) => r.bookings },
    { key: "last", header: "Last purchase", cell: (r) => <span className="text-muted">{formatDate(r.last)}</span> },
    { key: "spent", header: "Paid to you", align: "right", cell: (r) => <span className="font-semibold">{formatMoney(r.spent)}</span> },
    { key: "contact", header: <span className="sr-only">Contact</span>, align: "right", cell: (r) => <a href={`mailto:${r.email}`} className="inline-grid size-9 place-items-center rounded-full hover:bg-surface-2" aria-label={`Email ${r.name}`}><Mail className="size-4" /></a> },
  ];
  return (
    <>
      <ListToolbar placeholder="Search customers" id="customers" />
      <DataTable columns={columns} rows={data.items} rowKey={(r) => r.id} page={data.page} pages={data.pages} total={data.total} empty="Customers appear here after their first order or booking." mobileTitle={(r) => <span className="flex items-center gap-3"><Avatar name={r.name} src={r.avatar} size={36} /><span className="font-semibold">{r.name}</span></span>} />
    </>
  );
}
