import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export function PageHeader({ title, description, actions, back }: { title: string; description?: React.ReactNode; actions?: React.ReactNode; back?: { href: string; label: string } }) {
  return (
    <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        {back && (
          <Link href={back.href} className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-muted hover:text-ink">
            <ChevronLeft className="size-4" /> {back.label}
          </Link>
        )}
        <h1 className="font-display text-[2.1rem] leading-tight tracking-tight text-ink md:text-[2.6rem]">{title}</h1>
        {description && <div className="mt-1.5 text-[15px] text-muted">{description}</div>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({ title, action, children, className = "", padded = true }: { title?: string; action?: React.ReactNode; children: React.ReactNode; className?: string; padded?: boolean }) {
  return (
    <section className={`rounded-[28px] border border-line bg-surface ${className}`}>
      {title && (
        <header className="flex items-center justify-between gap-3 border-b border-line px-5 py-4 md:px-6">
          <h2 className="font-display text-xl text-ink">{title}</h2>
          {action}
        </header>
      )}
      <div className={padded ? "p-5 md:p-6" : ""}>{children}</div>
    </section>
  );
}
