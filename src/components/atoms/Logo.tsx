import Link from "next/link";
import Image from "next/image";
import { cn } from "@/resources/utils/cn";

/** Wordmark: an ember knot glyph + the site name set in the display face. */
export function Logo({ name = "Nexora", logoUrl, className, href = "/" }: { name?: string; logoUrl?: string; className?: string; href?: string }) {
  return (
    <Link href={href} className={cn("group inline-flex items-center gap-2.5", className)} aria-label={`${name} home`}>
      {logoUrl ? (
        <Image src={logoUrl} alt="" width={32} height={32} className="size-8 rounded-lg object-contain" />
      ) : (
        <svg viewBox="0 0 32 32" className="size-8 transition-transform duration-500 group-hover:rotate-[120deg]" aria-hidden>
          <circle cx="16" cy="16" r="15" fill="var(--accent)" />
          <path d="M9.5 21.5V10.5l13 11V10.5" fill="none" stroke="var(--accent-ink)" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
      <span className="font-display text-[1.45rem] leading-none tracking-[-0.03em] text-ink">{name}</span>
    </Link>
  );
}
