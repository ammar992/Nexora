import { cn } from "@/resources/utils/cn";

export function EmptyState({ icon, title, description, action, className }: { icon?: React.ReactNode; title: string; description?: string; action?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col items-center rounded-[28px] border border-dashed border-line-strong bg-surface/60 px-6 py-14 text-center", className)}>
      {icon && <div className="mb-5 grid size-14 place-items-center rounded-2xl bg-accent-soft text-accent [&_svg]:size-6">{icon}</div>}
      <h3 className="font-display text-2xl text-ink">{title}</h3>
      {description && <p className="mt-2 max-w-md text-[15px] text-muted text-pretty">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
