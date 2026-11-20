"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Formik, Form, useFormikContext } from "formik";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Package, CalendarClock, Plus, X, Send, Save } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { Switch } from "@/components/atoms/Field";
import { FInput, FTextArea, FSelect } from "@/components/molecules/FormikFields";
import { ImageUploader } from "@/components/molecules/ImageUploader";
import { ListingCard } from "@/components/molecules/ListingCard";
import { Panel } from "@/components/organisms/dashboard/PageHeader";
import { listingSchema } from "@/formik/schema/listing";
import { api, errorMessage } from "@/interceptor/api";
import { WEEKDAYS } from "@/resources/utils/slots";
import { cn } from "@/resources/utils/cn";

type Cat = { _id: string; name: string; type: string };

import { EMPTY_LISTING, type ListingFormValues } from "@/resources/utils/listingDefaults";

function ChipInput({ label, values, onChange, max, placeholder }: { label: string; values: string[]; onChange: (v: string[]) => void; max: number; placeholder: string }) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const v = draft.trim();
    if (!v || values.includes(v) || values.length >= max) return;
    onChange([...values, v]);
    setDraft("");
  };
  return (
    <div>
      <p className="mb-2 text-sm font-semibold text-ink">{label}</p>
      <div className="flex flex-wrap gap-2 rounded-2xl border border-line bg-surface p-2 focus-within:border-accent">
        {values.map((v) => (
          <motion.span layout key={v} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="inline-flex items-center gap-1 rounded-full bg-surface-2 py-1 pr-1.5 pl-3 text-[13px] font-semibold text-ink">
            {v}
            <button type="button" onClick={() => onChange(values.filter((x) => x !== v))} className="grid size-5 place-items-center rounded-full hover:bg-surface-3" aria-label={`Remove ${v}`}><X className="size-3" /></button>
          </motion.span>
        ))}
        <input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(); } }} onBlur={add} placeholder={values.length >= max ? `Up to ${max}` : placeholder} disabled={values.length >= max} className="min-w-32 flex-1 bg-transparent px-2 py-1 text-sm outline-none" />
      </div>
    </div>
  );
}

function Preview({ categories }: { categories: Cat[] }) {
  const { values } = useFormikContext<ListingFormValues>();
  const cat = categories.find((c) => c._id === values.category);
  return (
    <div className="pointer-events-none">
      <ListingCard
        listing={{
          _id: "preview", slug: "", title: values.title || "Your listing title", summary: values.summary, type: values.type, price: Number(values.price) || 0,
          compareAtPrice: Number(values.compareAtPrice) || undefined, priceUnit: values.type === "service" ? values.priceUnit : "item", currency: "USD",
          image: values.images[0]?.url ?? "", imageAlt: values.title, rating: 0, reviewCount: 0, location: values.location, featured: false, stock: Number(values.stock) || 0,
          category: cat ? { name: cat.name, slug: "" } : null, vendor: null,
        }}
      />
    </div>
  );
}

/** Create/edit form for products and services. `endpoint` is POST for new, PUT for existing. */
export function ListingForm({ categories, initial = EMPTY_LISTING, listingId, backHref, currentStatus }: { categories: Cat[]; initial?: ListingFormValues; listingId?: string; backHref: string; currentStatus?: string }) {
  const router = useRouter();
  const [submitMode, setSubmitMode] = useState<"draft" | "pending">("pending");
  const [blocked, setBlocked] = useState("");

  return (
    <Formik
      initialValues={initial}
      validationSchema={listingSchema}
      onSubmit={async (values, { setErrors }) => {
        const payload = { ...values, compareAtPrice: values.compareAtPrice === "" ? undefined : values.compareAtPrice, submit: submitMode };
        try {
          const res = listingId ? await api.put<{ status: string; slug: string }>(`/vendor/listings/${listingId}`, payload) : await api.post<{ status: string; slug: string }>("/vendor/listings", payload);
          toast.success(res.status === "approved" ? "Listing is live" : res.status === "draft" ? "Draft saved" : "Submitted for review. We'll notify you when it's approved.");
          router.push(backHref);
          router.refresh();
        } catch (err) {
          const fields = (err as { fields?: Record<string, string> }).fields;
          if (fields) setErrors(fields as never);
          toast.error(errorMessage(err));
        }
      }}
    >
      {({ values, setFieldValue, isSubmitting, errors, touched, submitCount }) => {
        const isService = values.type === "service";
        const cats = categories.filter((c) => c.type === "both" || c.type === values.type);
        const av = values.availability;
        return (
          <Form noValidate className="grid gap-6 xl:grid-cols-[1fr_320px]">
            <div className="space-y-6">
              <Panel title="What are you listing?">
                <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Listing type">
                  {([
                    { v: "product", t: "A product", d: "Something you ship to customers.", icon: Package },
                    { v: "service", t: "A service", d: "Time customers book on your calendar.", icon: CalendarClock },
                  ] as const).map((o) => {
                    const active = values.type === o.v;
                    return (
                      <button key={o.v} type="button" role="radio" aria-checked={active} onClick={() => { setFieldValue("type", o.v); setFieldValue("priceUnit", o.v === "service" ? "session" : "item"); if (!cats.find((c) => c._id === values.category && (c.type === "both" || c.type === o.v))) setFieldValue("category", ""); }} className={cn("relative flex items-start gap-3 rounded-3xl border p-5 text-left transition", active ? "border-accent" : "border-line hover:border-line-strong")}>
                        {active && <motion.span layoutId="ltype" className="absolute inset-0 -z-10 rounded-3xl bg-accent-soft" />}
                        <o.icon className={cn("mt-0.5 size-6", active ? "text-accent" : "text-muted")} />
                        <span>
                          <span className="block font-semibold text-ink">{o.t}</span>
                          <span className="block text-[13px] text-muted">{o.d}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </Panel>

              <Panel title="Basics">
                <div className="grid gap-4">
                  <FInput name="title" label="Title" maxLength={120} />
                  <FInput name="summary" label="One-line summary (optional)" maxLength={200} />
                  <FSelect name="category" label="Category">
                    <option value="">Choose a category</option>
                    {cats.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </FSelect>
                  <FTextArea name="description" label="Description" rows={7} maxLength={5000} hint="What it is, what's included, materials or process, and anything customers should know." />
                </div>
              </Panel>

              <Panel title="Photos">
                <ImageUploader value={values.images} onChange={(v) => setFieldValue("images", v)} error={(touched.images || submitCount > 0) && typeof errors.images === "string" ? errors.images : undefined} />
              </Panel>

              <Panel title="Pricing">
                <div className="grid gap-4 sm:grid-cols-3">
                  <FInput name="price" type="number" min={0} step="0.01" label="Price (USD)" />
                  <FInput name="compareAtPrice" type="number" min={0} step="0.01" label="Compare-at price (optional)" hint="Shows as a strikethrough" />
                  {isService && (
                    <FSelect name="priceUnit" label="Charged per">
                      <option value="session">Session</option>
                      <option value="hour">Hour</option>
                      <option value="day">Day</option>
                      <option value="person">Person</option>
                    </FSelect>
                  )}
                </div>
              </Panel>

              {!isService ? (
                <Panel title="Inventory & shipping">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <FInput name="stock" type="number" min={0} step="1" label="Units in stock" />
                    <FInput name="sku" label="SKU (optional)" />
                    <FInput name="shippingFee" type="number" min={0} step="0.01" label="Shipping fee" />
                  </div>
                </Panel>
              ) : (
                <Panel title="Availability">
                  <div className="space-y-6">
                    <div>
                      <p className="mb-2 text-sm font-semibold text-ink">Days you take bookings</p>
                      <div className="flex flex-wrap gap-2">
                        {WEEKDAYS.map((d, i) => {
                          const on = av.days.includes(i);
                          return (
                            <motion.button key={d} type="button" whileTap={{ scale: 0.9 }} aria-pressed={on} onClick={() => setFieldValue("availability.days", on ? av.days.filter((x) => x !== i) : [...av.days, i].sort())} className={cn("h-11 w-14 rounded-2xl border text-sm font-semibold transition", on ? "border-ink bg-ink text-bg" : "border-line text-muted hover:border-line-strong")}>
                              {d}
                            </motion.button>
                          );
                        })}
                      </div>
                      {typeof (errors.availability as Record<string, string> | undefined)?.days === "string" && <p className="pt-1 text-[13px] text-danger">{(errors.availability as Record<string, string>).days}</p>}
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      <FInput name="availability.startTime" type="time" label="Opens" />
                      <FInput name="availability.endTime" type="time" label="Closes" />
                      <FInput name="durationMinutes" type="number" min={0} step="5" label="Duration (min)" />
                      <FSelect name="availability.slotMinutes" label="Slot every">
                        {[15, 30, 45, 60, 90, 120, 150, 180, 240, 480].map((m) => <option key={m} value={m}>{m >= 60 ? `${m / 60} h` : `${m} min`}</option>)}
                      </FSelect>
                      <FInput name="availability.capacityPerSlot" type="number" min={1} label="People per slot" />
                      <FInput name="availability.leadTimeHours" type="number" min={0} label="Notice needed (hours)" />
                      <FInput name="availability.maxAdvanceDays" type="number" min={1} max={365} label="Book up to (days ahead)" />
                    </div>
                    <BlockedDates value={av.blockedDates} onChange={(v) => setFieldValue("availability.blockedDates", v)} />
                  </div>
                </Panel>
              )}

              <Panel title="Location & details">
                <div className="grid gap-4 sm:grid-cols-2">
                  <FInput name="location.city" label="City" />
                  <FInput name="location.country" label="Country" />
                  {isService && <div className="sm:col-span-2"><Switch label="Offered online" description="Customers can book this remotely." checked={values.location.remote} onChange={(v) => setFieldValue("location.remote", v)} /></div>}
                  <div className="sm:col-span-2"><ChipInput label="Highlights" values={values.highlights} onChange={(v) => setFieldValue("highlights", v)} max={8} placeholder="e.g. Hand-thrown, 24 cm tall — press Enter" /></div>
                  <div className="sm:col-span-2"><ChipInput label="Search tags" values={values.tags} onChange={(v) => setFieldValue("tags", v.map((t) => t.toLowerCase()))} max={12} placeholder="e.g. ceramics — press Enter" /></div>
                </div>
              </Panel>
            </div>

            <aside className="space-y-4">
              <div className="sticky top-24 space-y-4">
                <p className="eyebrow">Live preview</p>
                <Preview categories={categories} />
                {currentStatus === "approved" && <p className="rounded-2xl bg-info-soft p-3 text-[13px] text-info">Changing the title, photos, description or category sends this listing back for a quick review. Price and stock changes go live immediately.</p>}
                {blocked && <p className="text-[13px] text-danger">{blocked}</p>}
                <div className="grid gap-2">
                  <Button type="submit" size="lg" loading={isSubmitting && submitMode === "pending"} disabled={isSubmitting} onClick={() => { setSubmitMode("pending"); setBlocked(""); }}>
                    <Send className="size-4" /> {currentStatus === "approved" ? "Save changes" : "Submit for review"}
                  </Button>
                  <Button type="submit" variant="secondary" size="lg" loading={isSubmitting && submitMode === "draft"} disabled={isSubmitting} onClick={() => setSubmitMode("draft")}>
                    <Save className="size-4" /> Save as draft
                  </Button>
                </div>
                {submitCount > 0 && Object.keys(errors).length > 0 && <p className="text-[13px] font-semibold text-danger">Please fix the highlighted fields.</p>}
              </div>
            </aside>
          </Form>
        );
      }}
    </Formik>
  );
}

function BlockedDates({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [d, setD] = useState("");
  return (
    <div>
      <p className="mb-2 text-sm font-semibold text-ink">Days off</p>
      <div className="flex flex-wrap items-center gap-2">
        {value.map((x) => (
          <span key={x} className="inline-flex items-center gap-1 rounded-full bg-surface-2 py-1 pr-1.5 pl-3 text-[13px] font-semibold">
            {new Date(`${x}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            <button type="button" onClick={() => onChange(value.filter((y) => y !== x))} className="grid size-5 place-items-center rounded-full hover:bg-surface-3" aria-label="Remove date"><X className="size-3" /></button>
          </span>
        ))}
        <label className="inline-flex h-9 items-center gap-2 rounded-full border border-line px-3 text-sm">
          <span className="sr-only">Add a day off</span>
          <input type="date" value={d} min={new Date().toISOString().slice(0, 10)} onChange={(e) => setD(e.target.value)} className="bg-transparent outline-none" />
        </label>
        <Button size="sm" variant="secondary" disabled={!d || value.includes(d)} onClick={() => { onChange([...value, d].sort()); setD(""); }}>
          <Plus className="size-4" /> Add
        </Button>
      </div>
    </div>
  );
}
