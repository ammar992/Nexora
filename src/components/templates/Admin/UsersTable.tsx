"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { BadgeCheck } from "lucide-react";
import { DataTable, type Column } from "@/components/organisms/dashboard/DataTable";
import { ListToolbar, FilterSelect } from "@/components/organisms/dashboard/ListToolbar";
import { Modal } from "@/components/molecules/Modal";
import { Avatar } from "@/components/atoms/Avatar";
import { StatusBadge } from "@/components/atoms/Badge";
import { Button } from "@/components/atoms/Button";
import { Input, Select, Switch } from "@/components/atoms/Field";
import { api, errorMessage } from "@/interceptor/api";
import { formatDate } from "@/resources/utils/format";
import { TimeAgo } from "@/components/atoms/TimeAgo";

type Row = { _id: string; name: string; email: string; role: string; avatar?: string; isActive: boolean; emailVerified: boolean; createdAt: string; lastLoginAt?: string };

export function UsersTable({ data, selfId }: { data: { items: Row[]; total: number; page: number; pages: number; counts: Record<string, number> }; selfId: string }) {
  const router = useRouter();
  const [edit, setEdit] = useState<Row | null>(null);
  const [form, setForm] = useState<Row | null>(null);
  const [busy, setBusy] = useState(false);

  function open(r: Row) {
    setEdit(r);
    setForm({ ...r });
  }

  async function save() {
    if (!form || !edit) return;
    setBusy(true);
    try {
      await api.patch(`/admin/users/${edit._id}`, { name: form.name, role: form.role, isActive: form.isActive, emailVerified: form.emailVerified });
      toast.success("User updated");
      setEdit(null);
      router.refresh();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  const columns: Column<Row>[] = [
    { key: "user", header: "User", mobile: false, cell: (r) => <span className="flex items-center gap-3"><Avatar name={r.name} src={r.avatar} size={36} /><span className="min-w-0"><span className="flex items-center gap-1 font-semibold text-ink">{r.name}{r.emailVerified && <BadgeCheck className="size-3.5 text-success" aria-label="Verified" />}</span><span className="block truncate text-[12px] text-muted">{r.email}</span></span></span> },
    { key: "role", header: "Role", cell: (r) => <StatusBadge status={r.role} /> },
    { key: "status", header: "Status", cell: (r) => <StatusBadge status={r.isActive ? "active" : "inactive"} /> },
    { key: "joined", header: "Joined", cell: (r) => <span className="text-muted">{formatDate(r.createdAt)}</span> },
    { key: "seen", header: "Last sign-in", cell: (r) => <span className="text-muted">{r.lastLoginAt ? <TimeAgo value={r.lastLoginAt} /> : "—"}</span> },
    { key: "edit", header: <span className="sr-only">Edit</span>, align: "right", cell: () => <span className="text-sm font-semibold text-accent">Edit</span> },
  ];

  return (
    <>
      <ListToolbar placeholder="Search name or email" id="users" param="status" statuses={["active", "inactive"]}>
        <FilterSelect param="role" label="Role" options={[{ value: "customer", label: `Customers (${data.counts.customer ?? 0})` }, { value: "vendor", label: `Vendors (${data.counts.vendor ?? 0})` }, { value: "admin", label: `Admins (${data.counts.admin ?? 0})` }]} />
      </ListToolbar>
      <DataTable columns={columns} rows={data.items} rowKey={(r) => r._id} page={data.page} pages={data.pages} total={data.total} onRowClick={open} mobileTitle={(r) => <span className="flex items-center gap-3"><Avatar name={r.name} src={r.avatar} size={36} /><span className="font-semibold">{r.name}</span></span>} />
      <Modal open={!!edit} onClose={() => setEdit(null)} title="Edit user" description={edit?.email}>
        {form && (
          <div className="space-y-5">
            <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Select label="Role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} disabled={form._id === selfId} hint="Vendors need an approved vendor application first.">
              <option value="customer">Customer</option>
              <option value="vendor">Vendor</option>
              <option value="admin">Admin</option>
            </Select>
            <Switch label="Account active" description="Inactive users are signed out and can't sign in." checked={form.isActive} disabled={form._id === selfId} onChange={(v) => setForm({ ...form, isActive: v })} />
            <Switch label="Email verified" checked={form.emailVerified} onChange={(v) => setForm({ ...form, emailVerified: v })} />
            <Button size="lg" className="w-full" loading={busy} onClick={save}>Save changes</Button>
          </div>
        )}
      </Modal>
    </>
  );
}
