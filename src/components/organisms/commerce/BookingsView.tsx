"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Clock, Mail, Phone, Users } from "lucide-react";
import { DataTable, type Column } from "@/components/organisms/dashboard/DataTable";
import { ListToolbar, FilterSelect } from "@/components/organisms/dashboard/ListToolbar";
import { Drawer } from "@/components/molecules/Modal";
import { StatusBadge } from "@/components/atoms/Badge";
import { Avatar } from "@/components/atoms/Avatar";
import { StatusActions } from "./StatusActions";
import { Timeline } from "./Timeline";
import { formatDate, formatMoney, formatTime } from "@/resources/utils/format";
import type { Audience, BookingRow } from "./types";

const STATUSES = ["pending_payment", "pending", "confirmed", "completed", "cancelled", "refunded"];

export function BookingDetail({ booking: b, audience, onDone }: { booking: BookingRow; audience: Audience; onDone?: () => void }) {
  return (
    <div className="space-y-7">
      <div>
        <Link href={`/listing/${b.listing?.slug ?? ""}`} className="font-display text-2xl text-ink hover:text-accent">{b.listingSnapshot.title}</Link>
        <p className="mt-2 inline-flex items-center gap-2 rounded-full bg-surface-2 px-4 py-2 text-sm font-semibold text-ink">
          <Clock className="size-4" /> {formatDate(b.date, { weekday: "short" })} · {formatTime(b.timeSlot)}
          {b.listingSnapshot.durationMinutes ? ` · ${b.listingSnapshot.durationMinutes} min` : ""}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={b.status} />
        <StatusBadge status={b.paymentStatus} />
        <span className="text-[13px] text-muted">{b.paymentMethod === "manual" ? "Pay at appointment" : "Card"}</span>
      </div>
      <StatusActions kind="booking" id={b._id} status={b.status} paymentStatus={b.paymentStatus} paymentMethod={b.paymentMethod} audience={audience} startsAt={`${b.date}T${b.timeSlot}:00`} onDone={onDone} />
      <dl className="space-y-2 text-sm">
        <div className="flex justify-between"><dt className="text-muted">Guests</dt><dd className="inline-flex items-center gap-1"><Users className="size-3.5" />{b.guests}</dd></div>
        <div className="flex justify-between font-semibold"><dt>Total</dt><dd>{formatMoney(b.total, b.currency)}</dd></div>
        {audience !== "customer" && (
          <>
            <div className="flex justify-between text-muted"><dt>Platform commission</dt><dd>−{formatMoney(b.commission, b.currency)}</dd></div>
            <div className="flex justify-between font-semibold text-success"><dt>Vendor earnings</dt><dd>{formatMoney(b.vendorEarnings, b.currency)}</dd></div>
          </>
        )}
      </dl>
      <div className="rounded-3xl border border-line p-4 text-sm">
        <p className="eyebrow mb-2">{audience === "customer" ? "With" : "Customer contact"}</p>
        {audience === "customer" ? (
          <Link href={`/vendors/${b.vendor?.slug}`} className="font-semibold text-ink hover:text-accent">{b.vendor?.storeName}</Link>
        ) : (
          <>
            <p className="font-semibold text-ink">{b.contact.name || b.customer?.name}</p>
            <a href={`mailto:${b.contact.email || b.customer?.email}`} className="block text-muted hover:text-accent"><Mail className="mr-1 inline size-3.5" />{b.contact.email || b.customer?.email}</a>
            {b.contact.phone && <p className="text-muted"><Phone className="mr-1 inline size-3.5" />{b.contact.phone}</p>}
            {audience === "admin" && <p className="mt-1 text-muted">Vendor: {b.vendor?.storeName}</p>}
          </>
        )}
      </div>
      {b.notes && <p className="rounded-2xl bg-surface-2 p-4 text-sm text-ink-soft"><span className="font-semibold">Notes: </span>{b.notes}</p>}
      {b.cancellationReason && <p className="rounded-2xl bg-danger-soft p-4 text-sm text-danger"><span className="font-semibold">Cancellation reason: </span>{b.cancellationReason}</p>}
      <div>
        <p className="eyebrow mb-4">History</p>
        <Timeline history={b.statusHistory} />
      </div>
    </div>
  );
}

export function BookingsView({ data, audience }: { data: { items: BookingRow[]; total: number; page: number; pages: number; counts: Record<string, number> }; audience: Audience }) {
  const router = useRouter();
  const [selected, setSelected] = useState<BookingRow | null>(null);
  const columns: Column<BookingRow>[] = [
    { key: "when", header: "When", mobile: false, cell: (b) => (
      <span className="flex items-center gap-3">
        <span className="grid w-12 shrink-0 place-items-center rounded-xl bg-surface-2 py-1 text-center leading-tight">
          <span className="text-[10px] font-bold text-accent uppercase">{new Date(`${b.date}T00:00:00`).toLocaleDateString("en-US", { month: "short" })}</span>
          <span className="font-display text-lg text-ink">{b.date.slice(8)}</span>
        </span>
        <span className="text-[13px] text-muted">{formatTime(b.timeSlot)}</span>
      </span>
    ) },
    { key: "service", header: "Service", cell: (b) => <span className="line-clamp-1 max-w-56 font-semibold text-ink">{b.listingSnapshot.title}</span> },
    ...(audience === "customer"
      ? [{ key: "vendor", header: "With", cell: (b: BookingRow) => b.vendor?.storeName }]
      : [{ key: "customer", header: "Customer", cell: (b: BookingRow) => <span className="flex items-center gap-2"><Avatar name={b.customer?.name ?? "?"} src={b.customer?.avatar} size={28} /><span className="max-w-36 truncate">{b.customer?.name}</span></span> }]),
    ...(audience === "admin" ? [{ key: "vendor", header: "Vendor", cell: (b: BookingRow) => b.vendor?.storeName }] : []),
    { key: "guests", header: "Guests", cell: (b) => b.guests },
    { key: "status", header: "Status", cell: (b) => <StatusBadge status={b.status} /> },
    { key: "total", header: "Total", align: "right", cell: (b) => <span className="font-semibold">{formatMoney(audience === "vendor" ? b.vendorEarnings : b.total, b.currency)}</span> },
  ];
  return (
    <>
      <ListToolbar statuses={STATUSES} counts={data.counts} placeholder="Search reference, service or customer" id={`bookings-${audience}`}>
        <FilterSelect param="when" label="When" options={[{ value: "upcoming", label: "Upcoming" }, { value: "past", label: "Past" }]} />
      </ListToolbar>
      <DataTable
        columns={columns}
        rows={data.items}
        rowKey={(b) => b._id}
        page={data.page}
        pages={data.pages}
        total={data.total}
        empty={audience === "customer" ? "No bookings yet." : "No bookings match."}
        onRowClick={(b) => (audience === "customer" ? router.push(`/account/bookings/${b._id}`) : setSelected(b))}
        mobileTitle={(b) => <p className="font-semibold text-ink">{formatDate(b.date, { weekday: "short" })} · {formatTime(b.timeSlot)}</p>}
      />
      <Drawer open={!!selected} onClose={() => setSelected(null)} title={selected ? `Booking ${selected.reference}` : "Booking"}>
        {selected && <BookingDetail booking={selected} audience={audience} onDone={() => setSelected(null)} />}
      </Drawer>
    </>
  );
}
