"use client";

import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatMoney, formatCompact } from "@/resources/utils/format";

type Point = { label: string; revenue: number; commission?: number; count?: number };

function ChartTooltip({ active, payload, label, currency }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string; currency: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-2xl border border-line bg-surface px-4 py-3 text-sm shadow-lift">
      <p className="mb-1 font-semibold text-ink">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="flex items-center gap-2 text-muted">
          <span className="size-2 rounded-full" style={{ background: p.color }} />
          {p.name}: <span className="font-semibold text-ink">{p.name === "Orders" ? p.value : formatMoney(p.value, currency)}</span>
        </p>
      ))}
    </div>
  );
}

/** Monthly revenue area chart; a second series (commission) is optional. */
export function RevenueChart({ data, currency = "USD", primaryLabel = "Revenue", secondaryLabel, height = 280 }: { data: Point[]; currency?: string; primaryLabel?: string; secondaryLabel?: string; height?: number }) {
  const empty = data.every((d) => d.revenue === 0);
  return (
    <div style={{ height }} className="relative">
      {empty && <p className="absolute inset-0 z-10 grid place-items-center text-sm text-muted">Revenue will chart here once you have paid sales.</p>}
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 6, left: -12, bottom: 0 }}>
          <defs>
            <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="com" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--ink)" stopOpacity={0.18} />
              <stop offset="100%" stopColor="var(--ink)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--line)" strokeDasharray="3 6" vertical={false} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "var(--muted)", fontSize: 12 }} />
          <YAxis tickLine={false} axisLine={false} tick={{ fill: "var(--muted)", fontSize: 12 }} tickFormatter={(v: number) => formatCompact(v)} width={48} />
          <Tooltip content={<ChartTooltip currency={currency} />} cursor={{ stroke: "var(--line-strong)" }} />
          <Area type="monotone" dataKey="revenue" name={primaryLabel} stroke="var(--accent)" strokeWidth={2.5} fill="url(#rev)" animationDuration={900} />
          {secondaryLabel && <Area type="monotone" dataKey="commission" name={secondaryLabel} stroke="var(--ink)" strokeWidth={1.5} fill="url(#com)" animationDuration={1100} />}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CountBars({ data, height = 220 }: { data: Point[]; height?: number }) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 0, left: -24, bottom: 0 }}>
          <CartesianGrid stroke="var(--line)" strokeDasharray="3 6" vertical={false} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "var(--muted)", fontSize: 12 }} />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: "var(--muted)", fontSize: 12 }} />
          <Tooltip content={<ChartTooltip currency="USD" />} cursor={{ fill: "var(--surface-2)" }} />
          <Bar dataKey="count" name="Orders" fill="var(--ink)" radius={[8, 8, 0, 0]} animationDuration={900} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

const DONUT = ["var(--accent)", "var(--ink)", "var(--info)", "var(--success)", "var(--warning)"];

export function Donut({ data, height = 200 }: { data: { name: string; value: number }[]; height?: number }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div className="flex items-center gap-6">
      <div style={{ height, width: height }} className="relative shrink-0">
        <ResponsiveContainer>
          <PieChart>
            <Pie data={total ? data : [{ name: "none", value: 1 }]} dataKey="value" innerRadius="68%" outerRadius="100%" paddingAngle={total ? 3 : 0} stroke="none" animationDuration={900}>
              {(total ? data : [{ name: "none", value: 1 }]).map((_, i) => (
                <Cell key={i} fill={total ? DONUT[i % DONUT.length] : "var(--surface-3)"} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="font-display text-3xl text-ink">{total}</p>
            <p className="text-[11px] text-muted">total</p>
          </div>
        </div>
      </div>
      <ul className="space-y-2 text-sm">
        {data.map((d, i) => (
          <li key={d.name} className="flex items-center gap-2">
            <span className="size-2.5 rounded-full" style={{ background: DONUT[i % DONUT.length] }} />
            <span className="text-muted">{d.name}</span>
            <span className="font-semibold text-ink">{d.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
