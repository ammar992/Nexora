"use client";

import Link from "next/link";
import { Quote } from "lucide-react";
import { Stars } from "@/components/atoms/Stars";
import { Avatar } from "@/components/atoms/Avatar";
import { Stagger, StaggerItem } from "@/components/atoms/Reveal";
import { cn } from "@/resources/utils/cn";

type T = { _id: string; rating: number; title: string; comment: string; author: { name: string; avatar?: string } | null; listing: { title: string; slug: string } | null };

/** Verified reviews from real purchases — the section is hidden until there are some. */
export function Testimonials({ items }: { items: T[] }) {
  return (
    <Stagger className="grid grid-cols-1 gap-4 md:grid-cols-6">
      {items.slice(0, 5).map((t, i) => (
        <StaggerItem key={t._id} className={cn("min-w-0", i === 0 ? "md:col-span-4 md:row-span-2" : "md:col-span-2", i > 2 && "md:col-span-3")}>
          <figure className={cn("flex h-full flex-col rounded-[28px] border p-6 md:p-8", i === 0 ? "border-transparent bg-accent text-accent-ink" : "border-line bg-surface")}>
            <Quote className={cn("size-8", i === 0 ? "opacity-50" : "text-accent")} aria-hidden />
            <blockquote className={cn("mt-4 flex-1 text-pretty", i === 0 ? "font-display text-2xl leading-snug md:text-[2rem]" : "text-[15px] leading-relaxed text-ink-soft")}>
              {t.title && i === 0 && <span className="mb-3 block">{t.title}</span>}
              <span className={i === 0 ? "text-accent-ink/90" : ""}>“{t.comment.length > 320 ? `${t.comment.slice(0, 320)}…` : t.comment}”</span>
            </blockquote>
            <figcaption className="mt-6 flex flex-wrap items-center gap-3">
              <Avatar name={t.author?.name ?? "Customer"} src={t.author?.avatar} size={40} />
              <div className="min-w-0">
                <p className="text-sm font-semibold">{t.author?.name ?? "Verified customer"}</p>
                {t.listing && (
                  <Link href={`/listing/${t.listing.slug}`} className={cn("block truncate text-[13px] hover:underline", i === 0 ? "text-accent-ink/75" : "text-muted")}>
                    on {t.listing.title}
                  </Link>
                )}
              </div>
              <Stars value={t.rating} size={13} className={cn("ml-auto", i === 0 && "[&_.text-accent]:text-accent-ink [&_.text-line-strong]:text-accent-ink/30")} />
            </figcaption>
          </figure>
        </StaggerItem>
      ))}
    </Stagger>
  );
}
