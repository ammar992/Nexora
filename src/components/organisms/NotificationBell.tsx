"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, CheckCheck } from "lucide-react";
import { Dropdown } from "@/components/molecules/Dropdown";
import { api } from "@/interceptor/api";
import { timeAgo } from "@/resources/utils/format";
import { cn } from "@/resources/utils/cn";

type Note = { _id: string; title: string; body: string; link: string; read: boolean; createdAt: string };

export function NotificationBell() {
  const [items, setItems] = useState<Note[]>([]);
  const [unread, setUnread] = useState(0);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(
    () =>
      api
        .get<{ items: Note[]; unread: number }>("/notifications")
        .then((res) => {
          setItems(res.items);
          setUnread(res.unread);
        })
        .catch(() => {
          /* stay quiet in the header */
        })
        .finally(() => setLoaded(true)),
    []
  );

  // Poll once a minute while the tab is visible.
  useEffect(() => {
    const first = setTimeout(load, 0);
    const t = setInterval(() => document.visibilityState === "visible" && load(), 60_000);
    return () => {
      clearTimeout(first);
      clearInterval(t);
    };
  }, [load]);

  async function markAll() {
    setItems((xs) => xs.map((x) => ({ ...x, read: true })));
    setUnread(0);
    await api.patch("/notifications").catch(() => load());
  }

  async function open(n: Note) {
    if (!n.read) {
      setItems((xs) => xs.map((x) => (x._id === n._id ? { ...x, read: true } : x)));
      setUnread((u) => Math.max(0, u - 1));
      api.patch(`/notifications/${n._id}`).catch(() => {});
    }
  }

  return (
    <Dropdown
      label={`Notifications${unread ? `, ${unread} unread` : ""}`}
      className="w-[min(380px,calc(100vw-2rem))] p-0"
      trigger={() => (
        <span className="relative grid size-10 place-items-center rounded-full text-ink transition hover:bg-surface-2">
          <Bell className="size-[19px]" />
          <AnimatePresence>
            {unread > 0 && (
              <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="absolute top-1.5 right-1.5 grid min-w-4 place-items-center rounded-full bg-accent px-1 text-[10px] leading-4 font-bold text-accent-ink">
                {unread > 9 ? "9+" : unread}
              </motion.span>
            )}
          </AnimatePresence>
        </span>
      )}
    >
      {(close) => (
        <div>
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <p className="font-display text-lg text-ink">Notifications</p>
            {unread > 0 && (
              <button type="button" onClick={markAll} className="inline-flex items-center gap-1 text-[13px] font-semibold text-accent hover:underline">
                <CheckCheck className="size-4" /> Mark all read
              </button>
            )}
          </div>
          <div className="max-h-[60vh] overflow-y-auto p-2">
            {!loaded && [0, 1, 2].map((i) => <div key={i} className="skeleton m-2 h-14" />)}
            {loaded && items.length === 0 && <p className="px-4 py-10 text-center text-sm text-muted">You&apos;re all caught up.</p>}
            {items.map((n) => {
              const content = (
                <>
                  <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", n.read ? "bg-transparent" : "bg-accent")} aria-hidden />
                  <span className="min-w-0">
                    <span className={cn("block text-sm", n.read ? "text-ink-soft" : "font-semibold text-ink")}>{n.title}</span>
                    {n.body && <span className="line-clamp-2 block text-[13px] text-muted">{n.body}</span>}
                    <span className="mt-0.5 block text-[12px] text-muted">{timeAgo(n.createdAt)}</span>
                  </span>
                </>
              );
              const cls = "flex gap-3 rounded-2xl px-3 py-3 text-left transition hover:bg-surface-2";
              return n.link ? (
                <Link key={n._id} href={n.link} className={cls} onClick={() => { open(n); close(); }}>
                  {content}
                </Link>
              ) : (
                <button key={n._id} type="button" className={cn(cls, "w-full")} onClick={() => open(n)}>
                  {content}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </Dropdown>
  );
}
