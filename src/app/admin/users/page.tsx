import { requirePageUser } from "@/server/auth/session";
import { listUsers, type ListQuery } from "@/server/services/dashboard";
import { PageHeader } from "@/components/organisms/dashboard/PageHeader";
import { UsersTable } from "@/components/templates/Admin/UsersTable";

export const metadata = { title: "Users" };

export default async function AdminUsers({ searchParams }: { searchParams: Promise<ListQuery> }) {
  const admin = await requirePageUser(["admin"]);
  const data = await listUsers(await searchParams);
  return (
    <>
      <PageHeader title="Users" description="Search accounts, change roles, and activate or deactivate access." />
      <UsersTable data={data as never} selfId={admin.id} />
    </>
  );
}
