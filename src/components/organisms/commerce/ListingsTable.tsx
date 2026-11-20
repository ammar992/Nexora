"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Pencil, Eye, Trash2, Pause, Play, Check, X, Sparkles, Archive } from "lucide-react";
import { toast } from "sonner";
import { DataTable, type Column } from "@/components/organisms/dashboard/DataTable";
import { ListToolbar, FilterSelect } from "@/components/organisms/dashboard/ListToolbar";
import { Dropdown, MenuItem } from "@/components/molecules/Dropdown";
import { ConfirmDialog } from "@/components/molecules/ConfirmDialog";
import { StatusBadge, Badge } from "@/components/atoms/Badge";
import { api, errorMessage } from "@/interceptor/api";
import { formatMoney, formatDate } from "@/resources/utils/format";

type Row = {
  _id: string; title: string; slug: string; type: string; price: number; stock: number; status: string; featured: boolean; currency: string; priceUnit: string;
  images: { url: string }[]; rating: number; reviewCount: number; salesCount: number; views: number; updatedAt: string; rejectionReason?: string;
  vendor: { storeName: string; slug: string } | null; category: { name: string } | null;
};

function InlineStock({ row }: { row: Row }) {
  const router = useRouter();
  const [value, setValue] = useState(String(row.stock));
  const [saving, setSaving] = useState(false);
  if (row.type !== "product") return <span className="text-muted">—</span>;
  async function save() {
    const n = Number(value);
    if (!Number.isInteger(n) || n < 0 || n === row.stock) return setValue(String(row.stock));
    setSaving(true);
    try {
      await api.patch(`/vendor/listings/${row._id}/stock`, { stock: n });
      toast.success("Stock updated");
      router.refresh();
    } catch (err) {
      toast.error(errorMessage(err));
      setValue(String(row.stock));
    } finally {
      setSaving(false);
    }
  }
  return (
    <input aria-label={`Stock for ${row.title}`} value={value} inputMode="numeric" disabled={saving} onClick={(e) => e.stopPropagation()} onChange={(e) => setValue(e.target.value.replace(/\D/g, ""))} onBlur={save} onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()} className={`h-9 w-16 rounded-xl border bg-surface px-2 text-center text-sm outline-none focus:border-accent ${row.stock <= 3 ? "border-warning text-warning" : "border-line"}`} />
  );
}

export function ListingsTable({ data, audience }: { data: { items: Row[]; total: number; page: number; pages: number; counts: Record<string, number> }; audience: "vendor" | "admin" }) {
  const router = useRouter();
  const [confirm, setConfirm] = useState<{ row: Row; action: "delete" | "reject" | "archive" } | null>(null);
  const editHref = (r: Row) => (audience === "admin" ? `/admin/listings/${r._id}/edit` : `/vendor/listings/${r._id}/edit`);

  async function run(fn: () => Promise<unknown>, msg: string) {
    try {
      await fn();
      toast.success(msg);
      router.refresh();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }
  const moderate = (r: Row, body: object, msg: string) => run(() => api.patch(`/admin/listings/${r._id}`, body), msg);

  const columns: Column<Row>[] = [
    {
      key: "title", header: "Listing", mobile: false,
      cell: (r) => (
        <span className="flex items-center gap-3">
          <span className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-surface-2">{r.images?.[0]?.url && <Image src={r.images[0].url} alt="" fill sizes="48px" className="object-cover" />}</span>
          <span className="min-w-0">
            <Link href={editHref(r)} onClick={(e) => e.stopPropagation()} className="line-clamp-1 max-w-64 font-semibold text-ink hover:text-accent">{r.title}</Link>
            <span className="text-[12px] text-muted">{r.category?.name} · {r.type}{audience === "admin" && r.vendor ? ` · ${r.vendor.storeName}` : ""}</span>
          </span>
        </span>
      ),
    },
    { key: "price", header: "Price", cell: (r) => formatMoney(r.price, r.currency) },
    { key: "stock", header: "Stock", cell: (r) => (audience === "vendor" ? <InlineStock row={r} /> : r.type === "product" ? r.stock : "—") },
    { key: "perf", header: "Sold / views", cell: (r) => <span className="text-muted">{r.salesCount} / {r.views}</span> },
    { key: "status", header: "Status", cell: (r) => <span className="inline-flex flex-wrap items-center gap-1"><StatusBadge status={r.status} />{r.featured && <Badge tone="accent">Featured</Badge>}</span> },
    { key: "updated", header: "Updated", cell: (r) => <span className="whitespace-nowrap text-muted">{formatDate(r.updatedAt)}</span> },
    {
      key: "actions", header: <span className="sr-only">Actions</span>, align: "right",
      cell: (r) => (
        <span onClick={(e) => e.stopPropagation()} className="inline-block">
          <Dropdown label={`Actions for ${r.title}`} trigger={() => <span className="grid size-9 place-items-center rounded-full hover:bg-surface-2"><MoreHorizontal className="size-4" /></span>}>
            {(close) => (
              <>
                {r.status === "approved" && <MenuItem href={`/listing/${r.slug}`} icon={<Eye />} onClick={close}>View live</MenuItem>}
                {r.status !== "approved" && <MenuItem href={`/listing/${r.slug}`} icon={<Eye />} onClick={close}>Preview</MenuItem>}
                <MenuItem href={editHref(r)} icon={<Pencil />} onClick={close}>Edit</MenuItem>
                {audience === "vendor" && r.status === "approved" && <MenuItem icon={<Pause />} onClick={() => { close(); run(() => api.patch(`/vendor/listings/${r._id}/stock`, { paused: true }), "Listing paused (saved as draft)"); }}>Pause</MenuItem>}
                {audience === "vendor" && r.status === "draft" && <MenuItem icon={<Play />} onClick={() => { close(); run(() => api.patch(`/vendor/listings/${r._id}/stock`, { paused: false }), "Submitted for review"); }}>Submit for review</MenuItem>}
                {audience === "admin" && r.status !== "approved" && <MenuItem icon={<Check />} onClick={() => { close(); moderate(r, { status: "approved" }, "Listing approved"); }}>Approve</MenuItem>}
                {audience === "admin" && r.status !== "rejected" && <MenuItem icon={<X />} onClick={() => { close(); setConfirm({ row: r, action: "reject" }); }}>Reject…</MenuItem>}
                {audience === "admin" && r.status === "approved" && <MenuItem icon={<Sparkles />} onClick={() => { close(); moderate(r, { featured: !r.featured }, r.featured ? "Removed from featured" : "Featured on homepage"); }}>{r.featured ? "Unfeature" : "Feature"}</MenuItem>}
                {audience === "admin" && r.status !== "archived" && <MenuItem icon={<Archive />} onClick={() => { close(); setConfirm({ row: r, action: "archive" }); }}>Archive</MenuItem>}
                <MenuItem danger icon={<Trash2 />} onClick={() => { close(); setConfirm({ row: r, action: "delete" }); }}>Delete</MenuItem>
              </>
            )}
          </Dropdown>
        </span>
      ),
    },
  ];

  return (
    <>
      <ListToolbar statuses={["pending", "approved", "draft", "rejected", "archived"]} counts={data.counts} placeholder="Search listings" id={`listings-${audience}`}>
        <FilterSelect param="type" label="Type" options={[{ value: "product", label: "Products" }, { value: "service", label: "Services" }]} />
      </ListToolbar>
      <DataTable columns={columns} rows={data.items} rowKey={(r) => r._id} page={data.page} pages={data.pages} total={data.total} empty="No listings match." onRowClick={(r) => router.push(editHref(r))} mobileTitle={(r) => (
        <div className="flex items-center gap-3">
          <span className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-surface-2">{r.images?.[0]?.url && <Image src={r.images[0].url} alt="" fill sizes="48px" className="object-cover" />}</span>
          <p className="font-semibold text-ink">{r.title}</p>
        </div>
      )} />
      {data.items.some((r) => r.status === "rejected" && r.rejectionReason) && audience === "vendor" && (
        <div className="mt-6 space-y-2">
          {data.items.filter((r) => r.status === "rejected" && r.rejectionReason).map((r) => (
            <p key={r._id} className="rounded-2xl bg-danger-soft px-4 py-3 text-sm text-danger"><span className="font-semibold">{r.title}:</span> {r.rejectionReason}</p>
          ))}
        </div>
      )}
      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        tone="danger"
        title={confirm?.action === "reject" ? "Reject this listing?" : confirm?.action === "archive" ? "Archive this listing?" : "Delete this listing?"}
        description={confirm?.action === "delete" ? "Listings with past orders or bookings are archived instead, to keep customer history intact." : confirm?.action === "reject" ? "The vendor will see your reason and can edit and resubmit." : "It will be hidden from the marketplace."}
        confirmLabel={confirm?.action === "reject" ? "Reject" : confirm?.action === "archive" ? "Archive" : "Delete"}
        withReason={confirm?.action === "reject"}
        reasonRequired={confirm?.action === "reject"}
        onConfirm={async (reason) => {
          if (!confirm) return;
          const r = confirm.row;
          if (confirm.action === "reject") await moderate(r, { status: "rejected", reason }, "Listing rejected");
          else if (confirm.action === "archive") await moderate(r, { status: "archived" }, "Listing archived");
          else
            await run(async () => {
              const res = await api.delete<{ archived?: boolean }>(audience === "admin" ? `/admin/listings/${r._id}` : `/vendor/listings/${r._id}`);
              if (res.archived) toast.info("It had past orders, so it was archived instead.");
            }, "Listing removed");
        }}
      />
    </>
  );
}
