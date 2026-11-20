"use client";

import { motion } from "framer-motion";
import { STATUS_META } from "@/resources/utils/constant";
import { formatDateTime } from "@/resources/utils/format";
import type { History } from "./types";

export function Timeline({ history }: { history: History }) {
  const items = [...history].reverse();
  return (
    <ol className="relative space-y-5 pl-6">
      <span aria-hidden className="absolute top-1 bottom-1 left-[5px] w-px bg-line" />
      {items.map((h, i) => (
        <motion.li key={`${h.status}-${h.at}-${i}`} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="relative">
          <span aria-hidden className={`absolute top-1.5 -left-6 size-[11px] rounded-full border-2 border-surface ${i === 0 ? "bg-accent" : "bg-line-strong"}`} />
          <p className="text-sm font-semibold text-ink">{STATUS_META[h.status]?.label ?? h.status}</p>
          {h.note && <p className="text-[13px] text-ink-soft">{h.note}</p>}
          <p className="text-[12px] text-muted">{formatDateTime(h.at)}</p>
        </motion.li>
      ))}
    </ol>
  );
}
