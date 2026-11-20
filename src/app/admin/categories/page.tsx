import { listCategoriesAdmin } from "@/server/services/dashboard";
import { PageHeader } from "@/components/organisms/dashboard/PageHeader";
import { CategoriesManager } from "@/components/templates/Admin/CategoriesManager";

export const metadata = { title: "Categories" };

export default async function AdminCategories() {
  const items = await listCategoriesAdmin();
  return (
    <>
      <PageHeader title="Categories" description="Organise the catalog. Categories with images appear as large tiles on the homepage." />
      <CategoriesManager items={items as never} />
    </>
  );
}
