"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, CheckCheck, Trash2, Package, CalendarDays, Star, Store, Boxes, CreditCard, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/atoms/Button";
import { EmptyState } from "@/components/molecules/EmptyState";
import { api, errorMessage } from "@/interceptor/api";
import { TimeAgo } from "@/components/atoms/TimeAgo";
import { cn } from "@/resources/utils/cn";
import { useState } from "react";

type N = { _id: string; type: string; title: string; body: string; link: string; read: boolean; createdAt: string };
const ICON: Record<string, React.ReactNode> = { order: <Package />, booking: <CalendarDays />, review: <Star />, vendor: <Store />, listing: <Boxes />, payment: <CreditCard />, message: <MessageCircle /> };

export function NotificationsList({ items: initial }: { items: N[] }) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const unread = items.filter((n) => !n.read).length;
  return (
    <>
      <div className="mb-6 flex justify-end">
        <Button variant="secondary" size="sm" disabled={!unread} onClick={async () => {
          setItems((xs) => xs.map((x) => ({ ...x, read: true })));
          try { await api.patch("/notifications"); router.refresh(); } catch (err) { toast.error(errorMessage(err)); }
        }}>
          <CheckCheck className="size-4" /> Mark all read
        </Button>
      </div>
      {items.length === 0 ? (
        <EmptyState icon={<Bell />} title="No notifications" description="Order updates, booking changes and messages will show up here." />
      ) : (
        <ul className="overflow-hidden rounded-[28px] border border-line bg-surface">
          <AnimatePresence initial={false}>
            {items.map((n) => (
              <motion.li key={n._id} layout exit={{ opacity: 0, height: 0 }} className="flex items-start gap-4 border-b border-line px-5 py-4 last:border-0">
                <span className={cn("grid size-10 shrink-0 place-items-center rounded-2xl [&_svg]:size-[18px]", n.read ? "bg-surface-2 text-muted" : "bg-accent-soft text-accent")}>{ICON[n.type] ?? <Bell />}</span>
                <div className="min-w-0 flex-1">
                  {n.link ? (
                    <Link href={n.link} onClick={() => !n.read && api.patch(`/notifications/${n._id}`).catch(() => {})} className={cn("text-sm hover:text-accent", n.read ? "text-ink-soft" : "font-semibold text-ink")}>{n.title}</Link>
                  ) : (
                    <p className={cn("text-sm", n.read ? "text-ink-soft" : "font-semibold text-ink")}>{n.title}</p>
                  )}
                  {n.body && <p className="mt-0.5 text-[13px] text-muted">{n.body}</p>}
                  <p className="mt-1 text-[12px] text-muted"><TimeAgo value={n.createdAt} /></p>
                </div>
                <button type="button" aria-label="Delete notification" className="grid size-8 place-items-center rounded-full text-muted hover:bg-danger-soft hover:text-danger" onClick={async () => {
                  setItems((xs) => xs.filter((x) => x._id !== n._id));
                  await api.delete(`/notifications/${n._id}`).catch(() => {});
                }}>
                  <Trash2 className="size-4" />
                </button>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </>
  );
}
