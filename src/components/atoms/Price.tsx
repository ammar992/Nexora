import { formatMoney, PRICE_UNIT_LABEL } from "@/resources/utils/format";
import { cn } from "@/resources/utils/cn";

export function Price({ amount, compareAt, unit = "item", currency = "USD", className, size = "md" }: { amount: number; compareAt?: number; unit?: string; currency?: string; className?: string; size?: "sm" | "md" | "lg" }) {
  const sizes = { sm: "text-[15px]", md: "text-lg", lg: "text-3xl md:text-4xl" };
  return (
    <span className={cn("inline-flex flex-wrap items-baseline gap-x-2", className)}>
      <span className={cn("font-display font-medium tracking-tight text-ink", sizes[size])}>{formatMoney(amount, currency)}</span>
      {PRICE_UNIT_LABEL[unit] && <span className="text-[13px] text-muted">{PRICE_UNIT_LABEL[unit]}</span>}
      {compareAt && compareAt > amount ? (
        <span className="text-[13px] text-muted line-through">{formatMoney(compareAt, currency)}</span>
      ) : null}
    </span>
  );
}
