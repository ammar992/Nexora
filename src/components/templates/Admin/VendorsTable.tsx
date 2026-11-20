"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, X, Ban, RotateCcw, Sparkles, Star, Globe, Mail, MapPin, ExternalLink } from "lucide-react";
import { DataTable, type Column } from "@/components/organisms/dashboard/DataTable";
import { ListToolbar } from "@/components/organisms/dashboard/ListToolbar";
import { Drawer } from "@/components/molecules/Modal";
import { ConfirmDialog } from "@/components/molecules/ConfirmDialog";
import { Avatar } from "@/components/atoms/Avatar";
import { StatusBadge, Badge } from "@/components/atoms/Badge";
import { Button } from "@/components/atoms/Button";
import { api, errorMessage } from "@/interceptor/api";
import { formatDate, formatMoney } from "@/resources/utils/format";

type Row = {
  _id: string; storeName: string; slug: string; tagline: string; description: string; logo: string; status: string; featured: boolean; rejectionReason: string;
  location: { city: string; country: string }; contactEmail: string; contactPhone: string; website: string; rating: number; reviewCount: number; totalSales: number;
  createdAt: string; user: { name: string; email: string } | null; liveListings: number; salesCount: number;
};

export function VendorsTable({ data }: { data: { items: Row[]; total: number; page: number; pages: number; counts: Record<string, number> } }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Row | null>(null);
  const [confirm, setConfirm] = useState<{ row: Row; status: "rejected" | "suspended" } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  async function decide(row: Row, body: { status: string; reason?: string; featured?: boolean }, msg: string) {
    setBusy(body.status + (body.featured ?? ""));
    try {
      await api.patch(`/admin/vendors/${row._id}`, body);
      toast.success(msg);
      setSelected(null);
      router.refresh();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(null);
    }
  }

  const columns: Column<Row>[] = [
    { key: "store", header: "Store", mobile: false, cell: (r) => <span className="flex items-center gap-3"><Avatar name={r.storeName} src={r.logo} size={38} /><span><span className="flex items-center gap-1.5 font-semibold text-ink">{r.storeName}{r.featured && <Sparkles className="size-3.5 text-accent" aria-label="Featured" />}</span><span className="text-[12px] text-muted">{r.user?.name} · {r.location?.city}</span></span></span> },
    { key: "status", header: "Status", cell: (r) => <StatusBadge status={r.status} /> },
    { key: "listings", header: "Live listings", cell: (r) => r.liveListings },
    { key: "sales", header: "Sales", cell: (r) => <span>{r.salesCount} · <span className="text-muted">{formatMoney(r.totalSales)}</span></span> },
    { key: "rating", header: "Rating", cell: (r) => (r.reviewCount ? <span className="inline-flex items-center gap-1"><Star className="size-3.5 text-accent" fill="currentColor" />{r.rating.toFixed(1)} <span className="text-muted">({r.reviewCount})</span></span> : <span className="text-muted">—</span>) },
    { key: "applied", header: "Applied", cell: (r) => <span className="text-muted">{formatDate(r.createdAt)}</span> },
  ];

  const s = selected;
  return (
    <>
      <ListToolbar statuses={["pending", "approved", "rejected", "suspended"]} counts={data.counts} placeholder="Search stores, emails, cities" id="vendors" />
      <DataTable columns={columns} rows={data.items} rowKey={(r) => r._id} page={data.page} pages={data.pages} total={data.total} onRowClick={setSelected} mobileTitle={(r) => <span className="flex items-center gap-3"><Avatar name={r.storeName} src={r.logo} size={36} /><span className="font-semibold">{r.storeName}</span></span>} />

      <Drawer open={!!s} onClose={() => setSelected(null)} title={s?.storeName ?? "Vendor"}>
        {s && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar name={s.storeName} src={s.logo} size={64} />
              <div>
                <div className="flex flex-wrap gap-1.5"><StatusBadge status={s.status} />{s.featured && <Badge tone="accent">Featured</Badge>}</div>
                <p className="mt-1 text-sm text-muted">Owner: {s.user?.name} ({s.user?.email})</p>
              </div>
            </div>
            {s.tagline && <p className="font-display text-lg text-ink italic">“{s.tagline}”</p>}
            <p className="text-sm leading-relaxed text-ink-soft">{s.description}</p>
            <ul className="space-y-2 text-sm text-ink-soft">
              <li className="flex items-center gap-2"><MapPin className="size-4 text-muted" /> {s.location?.city}, {s.location?.country}</li>
              <li className="flex items-center gap-2"><Mail className="size-4 text-muted" /> <a href={`mailto:${s.contactEmail}`} className="hover:text-accent">{s.contactEmail}</a></li>
              {s.website && <li className="flex items-center gap-2"><Globe className="size-4 text-muted" /> <a href={s.website} target="_blank" rel="noopener noreferrer" className="hover:text-accent">{s.website}</a></li>}
            </ul>
            <dl className="grid grid-cols-3 gap-3 text-center">
              {[["Listings", s.liveListings], ["Sales", s.salesCount], ["Rating", s.reviewCount ? s.rating.toFixed(1) : "—"]].map(([k, v]) => (
                <div key={k} className="rounded-2xl bg-surface-2 p-3"><dt className="text-[12px] text-muted">{k}</dt><dd className="font-display text-2xl">{v}</dd></div>
              ))}
            </dl>
            {s.rejectionReason && <p className="rounded-2xl bg-danger-soft p-3 text-sm text-danger">Note: {s.rejectionReason}</p>}
            <div className="flex flex-wrap gap-2">
              {s.status !== "approved" && <Button loading={busy === "approved"} onClick={() => decide(s, { status: "approved" }, s.status === "suspended" ? "Vendor reinstated" : "Vendor approved")}>{s.status === "suspended" ? <><RotateCcw className="size-4" /> Reinstate</> : <><Check className="size-4" /> Approve</>}</Button>}
              {s.status === "pending" && <Button variant="secondary" className="!text-danger" onClick={() => setConfirm({ row: s, status: "rejected" })}><X className="size-4" /> Reject</Button>}
              {s.status === "approved" && <Button variant="secondary" loading={busy === `approved${!s.featured}`} onClick={() => decide(s, { status: "approved", featured: !s.featured }, s.featured ? "Removed from featured" : "Featured on homepage")}><Sparkles className="size-4" /> {s.featured ? "Unfeature" : "Feature"}</Button>}
              {s.status === "approved" && <Button variant="secondary" className="!text-danger" onClick={() => setConfirm({ row: s, status: "suspended" })}><Ban className="size-4" /> Suspend</Button>}
              {s.status === "approved" && <a href={`/vendors/${s.slug}`} target="_blank" className="inline-flex h-11 items-center gap-1 px-3 text-sm font-semibold text-muted hover:text-ink">Storefront <ExternalLink className="size-3.5" /></a>}
            </div>
          </div>
        )}
      </Drawer>
      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        tone="danger"
        title={confirm?.status === "rejected" ? "Reject this application?" : "Suspend this vendor?"}
        description={confirm?.status === "suspended" ? "Their live listings are hidden until you reinstate them. Existing orders are unaffected." : "They'll be emailed your reason and can apply again."}
        confirmLabel={confirm?.status === "rejected" ? "Reject" : "Suspend"}
        withReason
        reasonRequired
        onConfirm={async (reason) => {
          if (confirm) await decide(confirm.row, { status: confirm.status, reason }, confirm.status === "rejected" ? "Application rejected" : "Vendor suspended");
        }}
      />
    </>
  );
}
