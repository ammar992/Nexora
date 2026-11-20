"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Formik, Form } from "formik";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { Switch } from "@/components/atoms/Field";
import { Badge } from "@/components/atoms/Badge";
import { CategoryIcon, CATEGORY_ICONS } from "@/components/atoms/CategoryIcon";
import { SmartImage } from "@/components/atoms/SmartImage";
import { Modal } from "@/components/molecules/Modal";
import { ConfirmDialog } from "@/components/molecules/ConfirmDialog";
import { FInput, FTextArea, FSelect, applyServerErrors } from "@/components/molecules/FormikFields";
import { SingleImageUpload } from "@/components/molecules/ImageUploader";
import { categorySchema } from "@/formik/schema/listing";
import { api, errorMessage } from "@/interceptor/api";
import { cn } from "@/resources/utils/cn";

type Cat = { _id: string; name: string; slug: string; description: string; icon: string; image: string; type: string; isActive: boolean; sortOrder: number; listings: number };
const EMPTY = { name: "", description: "", icon: "Sparkles", image: "", type: "both", isActive: true, sortOrder: 0 };

export function CategoriesManager({ items }: { items: Cat[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<Cat | "new" | null>(null);
  const [del, setDel] = useState<Cat | null>(null);
  const initial = editing && editing !== "new" ? { name: editing.name, description: editing.description, icon: editing.icon, image: editing.image, type: editing.type, isActive: editing.isActive, sortOrder: editing.sortOrder } : { ...EMPTY, sortOrder: items.length };

  return (
    <>
      <div className="mb-6 flex justify-end">
        <Button onClick={() => setEditing("new")}><Plus className="size-4" /> New category</Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((c, i) => (
          <motion.article key={c._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className={cn("overflow-hidden rounded-[28px] border border-line bg-surface", !c.isActive && "opacity-60")}>
            <div className="relative h-28 bg-surface-2">
              {c.image ? <SmartImage src={c.image} alt="" fill sizes="400px" /> : <div className="grid h-full place-items-center text-accent"><CategoryIcon name={c.icon} className="size-8" /></div>}
            </div>
            <div className="p-5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="flex items-center gap-2 font-display text-xl text-ink"><CategoryIcon name={c.icon} className="size-4 text-accent" />{c.name}</h3>
                  <p className="text-[12px] text-muted">/{c.slug} · {c.listings} listing{c.listings === 1 ? "" : "s"}</p>
                </div>
                <div className="flex gap-1">
                  <Badge>{c.type === "both" ? "All" : `${c.type}s`}</Badge>
                  {!c.isActive && <Badge tone="danger">Hidden</Badge>}
                </div>
              </div>
              {c.description && <p className="mt-2 line-clamp-2 text-sm text-muted">{c.description}</p>}
              <div className="mt-4 flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => setEditing(c)}><Pencil className="size-4" /> Edit</Button>
                <Button size="sm" variant="ghost" className="!text-danger" onClick={() => setDel(c)}><Trash2 className="size-4" /> Delete</Button>
              </div>
            </div>
          </motion.article>
        ))}
      </div>

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing === "new" ? "New category" : "Edit category"} size="lg">
        <Formik
          enableReinitialize
          initialValues={initial}
          validationSchema={categorySchema}
          onSubmit={async (values, { setErrors }) => {
            try {
              if (editing === "new") await api.post("/admin/categories", values);
              else if (editing) await api.put(`/admin/categories/${editing._id}`, values);
              toast.success("Category saved");
              setEditing(null);
              router.refresh();
            } catch (err) {
              applyServerErrors(err, setErrors);
              toast.error(errorMessage(err));
            }
          }}
        >
          {({ values, setFieldValue, isSubmitting }) => (
            <Form className="space-y-4" noValidate>
              <div className="grid gap-4 sm:grid-cols-2">
                <FInput name="name" label="Name" />
                <FSelect name="type" label="Used for">
                  <option value="both">Products and services</option>
                  <option value="product">Products only</option>
                  <option value="service">Services only</option>
                </FSelect>
              </div>
              <FTextArea name="description" label="Description" rows={2} maxLength={300} />
              <div>
                <p className="mb-2 text-sm font-semibold text-ink">Icon</p>
                <div className="flex flex-wrap gap-1.5">
                  {Object.keys(CATEGORY_ICONS).map((name) => (
                    <button key={name} type="button" onClick={() => setFieldValue("icon", name)} aria-label={name} aria-pressed={values.icon === name} className={cn("grid size-10 place-items-center rounded-xl border transition", values.icon === name ? "border-accent bg-accent-soft text-accent" : "border-line text-muted hover:text-ink")}>
                      <CategoryIcon name={name} className="size-[18px]" />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2 text-sm font-semibold text-ink">Cover image (used on the homepage)</p>
                <SingleImageUpload value={values.image} onChange={(u) => setFieldValue("image", u)} folder="categories" label="Category image" shape="wide" />
              </div>
              <div className="grid items-center gap-4 sm:grid-cols-2">
                <FInput name="sortOrder" type="number" min={0} label="Sort order" />
                <Switch label="Visible" checked={values.isActive} onChange={(v) => setFieldValue("isActive", v)} />
              </div>
              <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>Save category</Button>
            </Form>
          )}
        </Formik>
      </Modal>
      <ConfirmDialog
        open={!!del}
        onClose={() => setDel(null)}
        tone="danger"
        title={`Delete “${del?.name}”?`}
        description={del?.listings ? `${del.listings} listing(s) use it, so it can't be deleted. Hide it instead.` : "This can't be undone."}
        confirmLabel="Delete"
        onConfirm={async () => {
          if (!del) return;
          try {
            await api.delete(`/admin/categories/${del._id}`);
            toast.success("Category deleted");
            router.refresh();
          } catch (err) {
            toast.error(errorMessage(err));
          }
        }}
      />
    </>
  );
}
