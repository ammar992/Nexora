import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Reveal } from "@/components/atoms/Reveal";
import { cn } from "@/resources/utils/cn";

export function SectionHeading({ eyebrow, title, description, href, linkLabel = "View all", className, align = "split" }: { eyebrow?: string; title: React.ReactNode; description?: string; href?: string; linkLabel?: string; className?: string; align?: "split" | "left" }) {
  return (
    <Reveal className={cn("mb-10 flex flex-col gap-5 md:mb-14", align === "split" && "md:flex-row md:items-end md:justify-between", className)}>
      <div className="max-w-2xl">
        {eyebrow && <p className="eyebrow mb-4">{eyebrow}</p>}
        <h2 className="display-lg text-balance text-ink">{title}</h2>
        {description && <p className="mt-4 max-w-xl text-[17px] text-muted text-pretty">{description}</p>}
      </div>
      {href && (
        <Link href={href} className="group inline-flex shrink-0 items-center gap-2 self-start border-b border-ink pb-1 text-sm font-semibold text-ink transition-colors hover:border-accent hover:text-accent md:self-auto">
          {linkLabel}
          <ArrowUpRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>
      )}
    </Reveal>
  );
}
