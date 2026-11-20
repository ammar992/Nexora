"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { MapPin, Mail, Phone, Truck } from "lucide-react";
import { DataTable, type Column } from "@/components/organisms/dashboard/DataTable";
import { ListToolbar } from "@/components/organisms/dashboard/ListToolbar";
import { Drawer } from "@/components/molecules/Modal";
import { StatusBadge } from "@/components/atoms/Badge";
import { Avatar } from "@/components/atoms/Avatar";
import { StatusActions } from "./StatusActions";
import { Timeline } from "./Timeline";
import { formatDate, formatMoney } from "@/resources/utils/format";
import type { Audience, OrderRow } from "./types";

const STATUSES = ["pending_payment", "processing", "shipped", "delivered", "cancelled", "refunded"];

export function OrderDetail({ order, audience, onDone }: { order: OrderRow; audience: Audience; onDone?: () => void }) {
  const a = order.shippingAddress;
  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={order.status} />
        <StatusBadge status={order.paymentStatus} />
        <span className="text-[13px] text-muted">{order.paymentMethod === "manual" ? "Pay on delivery" : "Card"}</span>
      </div>
      <StatusActions kind="order" id={order._id} status={order.status} paymentStatus={order.paymentStatus} paymentMethod={order.paymentMethod} audience={audience} onDone={onDone} />

      <ul className="divide-y divide-line rounded-3xl border border-line">
        {order.items.map((i) => (
          <li key={i.listing} className="flex items-center gap-3 p-3">
            <span className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-surface-2">{i.image && <Image src={i.image} alt="" fill sizes="56px" className="object-cover" />}</span>
            <span className="min-w-0 flex-1">
              <span className="line-clamp-1 text-sm font-semibold text-ink">{i.title}</span>
              <span className="text-[12px] text-muted">{i.quantity} × {formatMoney(i.unitPrice, order.currency)}</span>
            </span>
            <span className="text-sm font-semibold">{formatMoney(i.lineTotal, order.currency)}</span>
          </li>
        ))}
      </ul>

      <dl className="space-y-2 text-sm">
        <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd>{formatMoney(order.subtotal, order.currency)}</dd></div>
        <div className="flex justify-between"><dt className="text-muted">Shipping</dt><dd>{order.shippingFee ? formatMoney(order.shippingFee, order.currency) : "Free"}</dd></div>
        <div className="flex justify-between font-semibold"><dt>Total</dt><dd>{formatMoney(order.total, order.currency)}</dd></div>
        {audience !== "customer" && (
          <>
            <div className="flex justify-between text-muted"><dt>Platform commission</dt><dd>−{formatMoney(order.commission, order.currency)}</dd></div>
            <div className="flex justify-between font-semibold text-success"><dt>Vendor earnings</dt><dd>{formatMoney(order.vendorEarnings, order.currency)}</dd></div>
          </>
        )}
      </dl>

      {order.trackingNumber && (
        <p className="flex items-center gap-2 rounded-2xl bg-surface-2 px-4 py-3 text-sm"><Truck className="size-4 text-accent" /> Tracking: <span className="font-semibold">{order.trackingNumber}</span></p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-3xl border border-line p-4 text-sm">
          <p className="eyebrow mb-2">Ship to</p>
          <p className="font-semibold text-ink">{a.name}</p>
          <p className="text-muted"><MapPin className="mr-1 inline size-3.5" />{[a.line1, a.line2, a.city, a.state, a.postalCode, a.country].filter(Boolean).join(", ")}</p>
          {a.phone && <p className="mt-1 text-muted"><Phone className="mr-1 inline size-3.5" />{a.phone}</p>}
        </div>
        <div className="rounded-3xl border border-line p-4 text-sm">
          <p className="eyebrow mb-2">{audience === "customer" ? "Seller" : "Customer"}</p>
          {audience === "customer" ? (
            <Link href={`/vendors/${order.vendor?.slug}`} className="font-semibold text-ink hover:text-accent">{order.vendor?.storeName}</Link>
          ) : (
            <>
              <p className="font-semibold text-ink">{order.customer?.name}</p>
              <a href={`mailto:${order.customer?.email}`} className="text-muted hover:text-accent"><Mail className="mr-1 inline size-3.5" />{order.customer?.email}</a>
              {audience === "admin" && <p className="mt-1 text-muted">Vendor: {order.vendor?.storeName}</p>}
            </>
          )}
        </div>
      </div>
      {order.notes && <p className="rounded-2xl bg-surface-2 p-4 text-sm text-ink-soft"><span className="font-semibold">Note: </span>{order.notes}</p>}
      <div>
        <p className="eyebrow mb-4">History</p>
        <Timeline history={order.statusHistory} />
      </div>
    </div>
  );
}

export function OrdersView({ data, audience }: { data: { items: OrderRow[]; total: number; page: number; pages: number; counts: Record<string, number> }; audience: Audience }) {
  const router = useRouter();
  const [selected, setSelected] = useState<OrderRow | null>(null);
  const columns: Column<OrderRow>[] = [
    { key: "ref", header: "Order", cell: (o) => <span className="font-semibold text-ink">{o.reference}</span>, mobile: false },
    ...(audience === "customer"
      ? [{ key: "vendor", header: "Seller", cell: (o: OrderRow) => o.vendor?.storeName }]
      : [{ key: "customer", header: "Customer", cell: (o: OrderRow) => <span className="flex items-center gap-2"><Avatar name={o.customer?.name ?? "?"} src={o.customer?.avatar} size={28} /><span className="max-w-40 truncate">{o.customer?.name}</span></span> }]),
    ...(audience === "admin" ? [{ key: "vendor", header: "Vendor", cell: (o: OrderRow) => o.vendor?.storeName }] : []),
    { key: "items", header: "Items", cell: (o) => <span className="line-clamp-1 max-w-56 text-muted">{o.items.map((i) => `${i.quantity}× ${i.title}`).join(", ")}</span> },
    { key: "date", header: "Placed", cell: (o) => <span className="whitespace-nowrap text-muted">{formatDate(o.createdAt)}</span> },
    { key: "status", header: "Status", cell: (o) => <StatusBadge status={o.status} /> },
    { key: "pay", header: "Payment", cell: (o) => <StatusBadge status={o.paymentStatus} /> },
    { key: "total", header: "Total", align: "right", cell: (o) => <span className="font-semibold">{formatMoney(audience === "vendor" ? o.vendorEarnings : o.total, o.currency)}</span> },
  ];
  return (
    <>
      <ListToolbar statuses={STATUSES} counts={data.counts} placeholder="Search reference, item or customer" id={`orders-${audience}`} />
      <DataTable
        columns={columns}
        rows={data.items}
        rowKey={(o) => o._id}
        page={data.page}
        pages={data.pages}
        total={data.total}
        empty={audience === "customer" ? "You haven't placed any orders yet." : "No orders match."}
        onRowClick={(o) => (audience === "customer" ? router.push(`/account/orders/${o._id}`) : setSelected(o))}
        mobileTitle={(o) => <p className="font-semibold text-ink">{o.reference}</p>}
      />
      <Drawer open={!!selected} onClose={() => setSelected(null)} title={selected ? `Order ${selected.reference}` : "Order"}>
        {selected && <OrderDetail order={selected} audience={audience} onDone={() => setSelected(null)} />}
      </Drawer>
    </>
  );
}
