"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { EyeOff, Eye, MessageSquareReply, PenLine } from "lucide-react";
import { toast } from "sonner";
import { Stars } from "@/components/atoms/Stars";
import { Avatar } from "@/components/atoms/Avatar";
import { Badge } from "@/components/atoms/Badge";
import { Button } from "@/components/atoms/Button";
import { TextArea } from "@/components/atoms/Field";
import { Modal } from "@/components/molecules/Modal";
import { Pagination } from "@/components/molecules/Pagination";
import { EmptyState } from "@/components/molecules/EmptyState";
import { ListToolbar } from "@/components/organisms/dashboard/ListToolbar";
import { api, errorMessage } from "@/interceptor/api";
import { formatDate } from "@/resources/utils/format";

type Row = {
  _id: string; rating: number; title?: string; comment: string; createdAt: string; isHidden: boolean; verified: boolean;
  author: { name: string; avatar?: string; email?: string } | null; listing: { title: string; slug: string; images?: { url: string }[] } | null; vendor: { storeName: string } | null;
  vendorReply?: { text?: string; at?: string };
};

export function ReviewsManager({ data, audience }: { data: { items: Row[]; total: number; page: number; pages: number }; audience: "customer" | "vendor" | "admin" }) {
  const router = useRouter();
  const [replying, setReplying] = useState<Row | null>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  async function toggleHidden(r: Row) {
    setBusy(r._id);
    try {
      await api.patch(`/admin/reviews/${r._id}`, { isHidden: !r.isHidden });
      toast.success(r.isHidden ? "Review restored" : "Review hidden");
      router.refresh();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(null);
    }
  }

  async function sendReply() {
    if (!replying) return;
    setBusy("reply");
    try {
      await api.post(`/reviews/${replying._id}/reply`, { text });
      toast.success("Reply posted");
      setReplying(null);
      router.refresh();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(null);
    }
  }

  const statuses = audience === "admin" ? ["hidden"] : audience === "vendor" ? ["unreplied"] : undefined;

  return (
    <>
      <ListToolbar statuses={statuses} placeholder="Search reviews" id={`reviews-${audience}`} />
      {data.items.length === 0 ? (
        <EmptyState title="No reviews yet" description={audience === "customer" ? "Once an order is delivered or a booking completed, you can review it from the listing page." : "Reviews from verified customers will appear here."} />
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {data.items.map((r, i) => (
            <motion.article key={r._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 8) * 0.04 }} className={`rounded-[28px] border border-line bg-surface p-5 md:p-6 ${r.isHidden ? "opacity-60" : ""}`}>
              <header className="flex items-start gap-3">
                {audience === "customer" ? (
                  <span className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-surface-2">{r.listing?.images?.[0]?.url && <Image src={r.listing.images[0].url} alt="" fill sizes="48px" className="object-cover" />}</span>
                ) : (
                  <Avatar name={r.author?.name ?? "Customer"} src={r.author?.avatar} size={44} />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">{audience === "customer" ? r.listing?.title : r.author?.name}</p>
                  <p className="truncate text-[12px] text-muted">
                    {audience === "customer" ? r.vendor?.storeName : <Link href={`/listing/${r.listing?.slug}`} className="hover:text-accent">{r.listing?.title}</Link>} · {formatDate(r.createdAt)}
                  </p>
                </div>
                <Stars value={r.rating} />
              </header>
              {r.title && <h3 className="mt-4 font-display text-lg text-ink">{r.title}</h3>}
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{r.comment}</p>
              {r.vendorReply?.text && (
                <div className="mt-4 rounded-2xl bg-surface-2 p-3 text-sm">
                  <p className="mb-1 flex items-center gap-1.5 text-[12px] font-semibold text-ink"><MessageSquareReply className="size-3.5 text-accent" /> Vendor reply</p>
                  <p className="text-ink-soft">{r.vendorReply.text}</p>
                </div>
              )}
              <footer className="mt-4 flex flex-wrap items-center gap-2">
                {r.isHidden && <Badge tone="danger">Hidden</Badge>}
                {audience === "admin" && <span className="text-[12px] text-muted">{r.vendor?.storeName}</span>}
                <span className="flex-1" />
                {audience === "customer" && r.listing && (
                  <Link href={`/listing/${r.listing.slug}#reviews`} className="inline-flex items-center gap-1 text-sm font-semibold text-accent"><PenLine className="size-4" /> Edit</Link>
                )}
                {audience === "vendor" && (
                  <Button size="sm" variant="secondary" onClick={() => { setReplying(r); setText(r.vendorReply?.text ?? ""); }}>
                    <MessageSquareReply className="size-4" /> {r.vendorReply?.text ? "Edit reply" : "Reply"}
                  </Button>
                )}
                {audience === "admin" && (
                  <Button size="sm" variant="secondary" loading={busy === r._id} onClick={() => toggleHidden(r)}>
                    {r.isHidden ? <><Eye className="size-4" /> Restore</> : <><EyeOff className="size-4" /> Hide</>}
                  </Button>
                )}
              </footer>
            </motion.article>
          ))}
        </div>
      )}
      <Pagination page={data.page} pages={data.pages} className="mt-8" />
      <Modal open={!!replying} onClose={() => setReplying(null)} title="Reply to review" description="Your reply is public and shown under the review.">
        <TextArea label="Your reply" value={text} onChange={(e) => setText(e.target.value)} rows={4} maxLength={1000} />
        <Button className="mt-5 w-full" size="lg" loading={busy === "reply"} disabled={text.trim().length < 2} onClick={sendReply}>Post reply</Button>
      </Modal>
    </>
  );
}
