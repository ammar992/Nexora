"use client";

import { motion } from "framer-motion";
import { Inbox } from "lucide-react";
import { Pagination } from "@/components/molecules/Pagination";
import { cn } from "@/resources/utils/cn";
import { useQueryParams } from "@/resources/hooks/useQueryParams";

export type Column<T> = {
  key: string;
  header: React.ReactNode;
  cell: (row: T) => React.ReactNode;
  className?: string;
  /** Shown in the mobile card as a label/value row; set false to hide on mobile. */
  mobile?: boolean;
  align?: "left" | "right";
};

/**
 * Responsive data table: a real <table> from md up, stacked cards on phones.
 * Rows animate in with a short stagger; the whole table dims while the URL query updates.
 */
export function DataTable<T>({ columns, rows, rowKey, page, pages, total, empty = "Nothing here yet.", onRowClick, mobileTitle }: { columns: Column<T>[]; rows: T[]; rowKey: (r: T) => string; page?: number; pages?: number; total?: number; empty?: string; onRowClick?: (r: T) => void; mobileTitle?: (r: T) => React.ReactNode }) {
  const { pending } = useQueryParams();
  if (!rows.length) {
    return (
      <div className="flex flex-col items-center rounded-[28px] border border-dashed border-line-strong px-6 py-16 text-center">
        <Inbox className="size-8 text-muted" />
        <p className="mt-3 text-sm text-muted">{empty}</p>
      </div>
    );
  }
  return (
    <div className={cn("transition-opacity", pending && "pointer-events-none opacity-50")} aria-busy={pending}>
      <div className="hidden overflow-hidden rounded-[28px] border border-line bg-surface md:block">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line bg-surface-2/60">
                {columns.map((c) => (
                  <th key={c.key} scope="col" className={cn("px-5 py-3.5 text-[11px] font-bold tracking-[0.1em] whitespace-nowrap text-muted uppercase", c.align === "right" && "text-right", c.className)}>
                    {c.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <motion.tr
                  key={rowKey(r)}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i, 12) * 0.025 }}
                  onClick={onRowClick ? () => onRowClick(r) : undefined}
                  className={cn("border-b border-line last:border-0 transition-colors", onRowClick && "cursor-pointer hover:bg-surface-2/70")}
                >
                  {columns.map((c) => (
                    <td key={c.key} className={cn("px-5 py-4 align-middle", c.align === "right" && "text-right", c.className)}>
                      {c.cell(r)}
                    </td>
                  ))}
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ul className="space-y-3 md:hidden">
        {rows.map((r, i) => (
          <motion.li key={rowKey(r)} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 10) * 0.03 }}>
            <div role={onRowClick ? "button" : undefined} tabIndex={onRowClick ? 0 : undefined} onClick={onRowClick ? () => onRowClick(r) : undefined} onKeyDown={onRowClick ? (e) => e.key === "Enter" && onRowClick(r) : undefined} className="rounded-3xl border border-line bg-surface p-4">
              {mobileTitle && <div className="mb-3">{mobileTitle(r)}</div>}
              <dl className="space-y-2 text-sm">
                {columns
                  .filter((c) => c.mobile !== false)
                  .map((c) => (
                    <div key={c.key} className="flex items-center justify-between gap-4">
                      <dt className="text-[12px] font-semibold text-muted">{c.header}</dt>
                      <dd className="min-w-0 text-right">{c.cell(r)}</dd>
                    </div>
                  ))}
              </dl>
            </div>
          </motion.li>
        ))}
      </ul>

      <div className="mt-6 flex flex-col items-center justify-between gap-4 sm:flex-row">
        {total !== undefined && <p className="text-[13px] text-muted">{total.toLocaleString()} result{total === 1 ? "" : "s"}</p>}
        {page && pages ? <Pagination page={page} pages={pages} /> : null}
      </div>
    </div>
  );
}
