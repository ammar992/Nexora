"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Formik, Form } from "formik";
import { BadgeCheck, MessageSquareReply, PenLine } from "lucide-react";
import { toast } from "sonner";
import { Stars, RatingInput } from "@/components/atoms/Stars";
import { Avatar } from "@/components/atoms/Avatar";
import { Button } from "@/components/atoms/Button";
import { Modal } from "@/components/molecules/Modal";
import { FInput, FTextArea, applyServerErrors } from "@/components/molecules/FormikFields";
import { reviewSchema } from "@/formik/schema/listing";
import { api, errorMessage } from "@/interceptor/api";
import { formatDate } from "@/resources/utils/format";

type Review = { _id: string; rating: number; title?: string; comment: string; verified?: boolean; createdAt: string; author?: { name: string; avatar?: string } | null; vendorReply?: { text?: string; at?: string } };

export function Reviews({ listingId, rating, count, breakdown, reviews, canReview, existing, reason }: { listingId: string; rating: number; count: number; breakdown: Record<number, number>; reviews: Review[]; canReview: boolean; existing?: { rating: number; title: string; comment: string } | null; reason?: string }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  return (
    <section id="reviews" className="scroll-mt-28">
      <div className="grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <h2 className="font-display text-4xl text-ink">Reviews</h2>
          <div className="mt-6 flex items-end gap-4">
            <span className="font-display text-7xl leading-none text-ink">{count ? rating.toFixed(1) : "—"}</span>
            <div className="pb-2">
              <Stars value={rating} size={18} />
              <p className="mt-1 text-sm text-muted">{count} verified review{count === 1 ? "" : "s"}</p>
            </div>
          </div>
          <ul className="mt-6 space-y-2">
            {[5, 4, 3, 2, 1].map((n) => {
              const pct = count ? ((breakdown[n] ?? 0) / count) * 100 : 0;
              return (
                <li key={n} className="flex items-center gap-3 text-sm">
                  <span className="w-3 text-muted">{n}</span>
                  <span className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2">
                    <motion.span className="block h-full rounded-full bg-accent" initial={{ width: 0 }} whileInView={{ width: `${pct}%` }} viewport={{ once: true }} transition={{ duration: 0.8, ease: [0.25, 1, 0.5, 1] }} />
                  </span>
                  <span className="w-6 text-right text-muted">{breakdown[n] ?? 0}</span>
                </li>
              );
            })}
          </ul>
          {canReview ? (
            <Button variant="secondary" className="mt-8" onClick={() => setOpen(true)}>
              <PenLine className="size-4" /> {existing ? "Edit your review" : "Write a review"}
            </Button>
          ) : (
            reason && <p className="mt-8 text-[13px] text-muted">{reason}</p>
          )}
        </div>
        <div className="space-y-4 lg:col-span-8">
          {reviews.length === 0 && <p className="rounded-3xl border border-dashed border-line-strong p-10 text-center text-muted">No reviews yet. Reviews can only be left by customers who bought or booked this.</p>}
          {reviews.map((r, i) => (
            <motion.article key={r._id} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: Math.min(i, 5) * 0.05 }} className="rounded-3xl border border-line bg-surface p-6">
              <header className="flex items-center gap-3">
                <Avatar name={r.author?.name ?? "Customer"} src={r.author?.avatar} size={40} />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 text-sm font-semibold text-ink">
                    {r.author?.name ?? "Customer"}
                    {r.verified && (
                      <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-success">
                        <BadgeCheck className="size-3.5" /> Verified
                      </span>
                    )}
                  </p>
                  <p className="text-[12px] text-muted">{formatDate(r.createdAt)}</p>
                </div>
                <Stars value={r.rating} />
              </header>
              {r.title && <h3 className="mt-4 font-display text-xl text-ink">{r.title}</h3>}
              <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">{r.comment}</p>
              {r.vendorReply?.text && (
                <div className="mt-4 rounded-2xl bg-surface-2 p-4">
                  <p className="flex items-center gap-1.5 text-[13px] font-semibold text-ink">
                    <MessageSquareReply className="size-4 text-accent" /> Vendor reply
                  </p>
                  <p className="mt-1 text-sm text-ink-soft">{r.vendorReply.text}</p>
                </div>
              )}
            </motion.article>
          ))}
        </div>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={existing ? "Edit your review" : "Write a review"} description="Your review will show your name and a verified-purchase badge.">
        <Formik
          initialValues={{ rating: existing?.rating ?? 0, title: existing?.title ?? "", comment: existing?.comment ?? "" }}
          validationSchema={reviewSchema}
          onSubmit={async (values, { setErrors }) => {
            try {
              await api.post(`/listings/${listingId}/reviews`, values);
              toast.success("Thanks for your review");
              setOpen(false);
              router.refresh();
            } catch (err) {
              applyServerErrors(err, setErrors);
              toast.error(errorMessage(err));
            }
          }}
        >
          {({ values, setFieldValue, errors, touched, isSubmitting }) => (
            <Form className="space-y-4" noValidate>
              <RatingInput value={values.rating} onChange={(v) => setFieldValue("rating", v)} error={touched.rating || errors.rating ? errors.rating : undefined} />
              <FInput name="title" label="Headline (optional)" maxLength={100} />
              <FTextArea name="comment" label="What did you think?" rows={5} maxLength={2000} />
              <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>
                {existing ? "Update review" : "Post review"}
              </Button>
            </Form>
          )}
        </Formik>
      </Modal>
    </section>
  );
}
