"use client";

import { forwardRef, useId, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import { cn } from "@/resources/utils/cn";

type BaseProps = {
  label: string;
  error?: string | false;
  hint?: string;
  icon?: React.ReactNode;
  /** Render text after the input, e.g. a unit. */
  suffix?: React.ReactNode;
  containerClassName?: string;
};

export function FieldError({ id, error }: { id: string; error?: string | false }) {
  return (
    <AnimatePresence initial={false}>
      {error ? (
        <motion.p
          id={id}
          role="alert"
          initial={{ opacity: 0, y: -4, height: 0 }}
          animate={{ opacity: 1, y: 0, height: "auto" }}
          exit={{ opacity: 0, y: -4, height: 0 }}
          transition={{ duration: 0.2 }}
          className="flex items-center gap-1.5 overflow-hidden pt-1.5 text-[13px] font-medium text-danger"
        >
          <AlertCircle className="size-3.5 shrink-0" aria-hidden />
          {error}
        </motion.p>
      ) : null}
    </AnimatePresence>
  );
}

const shell =
  "group relative flex items-center rounded-2xl border bg-surface transition-[border-color,box-shadow,background-color] duration-200 focus-within:border-accent focus-within:shadow-[0_0_0_4px_var(--ring)]";

/** Text input with a floating label, animated focus ring and inline validation. */
export const Input = forwardRef<HTMLInputElement, BaseProps & React.InputHTMLAttributes<HTMLInputElement>>(function Input(
  { label, error, hint, icon, suffix, containerClassName, className, type = "text", id, ...rest },
  ref
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const [show, setShow] = useState(false);
  const isPassword = type === "password";
  return (
    <div className={containerClassName}>
      <div className={cn(shell, error ? "animate-shake border-danger" : "border-line hover:border-line-strong")}>
        {icon && <span className="pointer-events-none pl-4 text-muted [&_svg]:size-[18px]">{icon}</span>}
        <input
          ref={ref}
          id={inputId}
          type={isPassword && show ? "text" : type}
          placeholder=" "
          aria-invalid={!!error || undefined}
          aria-describedby={error ? `${inputId}-err` : hint ? `${inputId}-hint` : undefined}
          className={cn(
            "peer h-14 w-full min-w-0 bg-transparent px-4 pt-5 pb-1.5 text-[15px] text-ink outline-none placeholder:text-transparent disabled:opacity-60",
            icon && "pl-3",
            className
          )}
          {...rest}
        />
        <label
          htmlFor={inputId}
          className={cn(
            "pointer-events-none absolute top-1/2 origin-left -translate-y-1/2 text-[15px] text-muted transition-all duration-200",
            icon ? "left-12" : "left-4",
            "peer-focus:top-4 peer-focus:text-[11px] peer-focus:font-semibold peer-focus:tracking-wide peer-focus:text-accent",
            "peer-[:not(:placeholder-shown)]:top-4 peer-[:not(:placeholder-shown)]:text-[11px] peer-[:not(:placeholder-shown)]:font-semibold peer-[:not(:placeholder-shown)]:tracking-wide"
          )}
        >
          {label}
        </label>
        {suffix && <span className="pr-4 text-sm text-muted">{suffix}</span>}
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="mr-2 grid size-10 place-items-center rounded-full text-muted transition hover:bg-surface-2 hover:text-ink"
            aria-label={show ? "Hide password" : "Show password"}
          >
            {show ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}
          </button>
        )}
      </div>
      {hint && !error && (
        <p id={`${inputId}-hint`} className="pt-1.5 text-[13px] text-muted">
          {hint}
        </p>
      )}
      <FieldError id={`${inputId}-err`} error={error} />
    </div>
  );
});

export const TextArea = forwardRef<HTMLTextAreaElement, BaseProps & React.TextareaHTMLAttributes<HTMLTextAreaElement>>(function TextArea(
  { label, error, hint, containerClassName, className, id, rows = 4, ...rest },
  ref
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <div className={containerClassName}>
      <div className={cn(shell, "items-stretch", error ? "animate-shake border-danger" : "border-line hover:border-line-strong")}>
        <textarea
          ref={ref}
          id={inputId}
          rows={rows}
          placeholder=" "
          aria-invalid={!!error || undefined}
          aria-describedby={error ? `${inputId}-err` : undefined}
          className={cn("peer w-full resize-y bg-transparent px-4 pt-7 pb-3 text-[15px] leading-relaxed text-ink outline-none placeholder:text-transparent", className)}
          {...rest}
        />
        <label
          htmlFor={inputId}
          className="pointer-events-none absolute top-5 left-4 text-[15px] text-muted transition-all duration-200 peer-focus:top-2.5 peer-focus:text-[11px] peer-focus:font-semibold peer-focus:tracking-wide peer-focus:text-accent peer-[:not(:placeholder-shown)]:top-2.5 peer-[:not(:placeholder-shown)]:text-[11px] peer-[:not(:placeholder-shown)]:font-semibold"
        >
          {label}
        </label>
      </div>
      {hint && !error && <p className="pt-1.5 text-[13px] text-muted">{hint}</p>}
      <FieldError id={`${inputId}-err`} error={error} />
    </div>
  );
});

export const Select = forwardRef<HTMLSelectElement, BaseProps & React.SelectHTMLAttributes<HTMLSelectElement>>(function Select(
  { label, error, hint, containerClassName, className, id, children, ...rest },
  ref
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <div className={containerClassName}>
      <div className={cn(shell, error ? "border-danger" : "border-line hover:border-line-strong")}>
        <select
          ref={ref}
          id={inputId}
          aria-invalid={!!error || undefined}
          className={cn(
            "h-14 w-full cursor-pointer appearance-none bg-transparent px-4 pt-5 pb-1.5 pr-10 text-[15px] text-ink outline-none",
            className
          )}
          {...rest}
        >
          {children}
        </select>
        <label htmlFor={inputId} className="pointer-events-none absolute top-2.5 left-4 text-[11px] font-semibold tracking-wide text-muted">
          {label}
        </label>
        <svg className="pointer-events-none absolute right-4 size-4 text-muted" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
          <path d="M5.23 7.21a.75.75 0 011.06.02L10 11.06l3.71-3.83a.75.75 0 111.08 1.04l-4.25 4.39a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z" />
        </svg>
      </div>
      {hint && !error && <p className="pt-1.5 text-[13px] text-muted">{hint}</p>}
      <FieldError id={`${inputId}-err`} error={error} />
    </div>
  );
});

export function Checkbox({ label, description, className, ...rest }: { label: React.ReactNode; description?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className={cn("group flex cursor-pointer items-start gap-3 text-sm", className)}>
      <span className="relative mt-0.5 grid size-5 shrink-0 place-items-center">
        <input type="checkbox" className="peer absolute inset-0 cursor-pointer appearance-none rounded-md border border-line-strong bg-surface transition checked:border-accent checked:bg-accent focus-visible:outline-2 focus-visible:outline-accent" {...rest} />
        <svg className="pointer-events-none relative size-3 scale-50 text-accent-ink opacity-0 transition peer-checked:scale-100 peer-checked:opacity-100" viewBox="0 0 12 12" fill="none" aria-hidden>
          <path d="M2.5 6.5l2.2 2.2L9.5 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <span>
        <span className="font-medium text-ink">{label}</span>
        {description && <span className="block text-[13px] text-muted">{description}</span>}
      </span>
    </label>
  );
}

export function Switch({ checked, onChange, label, description, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: string; description?: string; disabled?: boolean }) {
  return (
    <label className={cn("flex cursor-pointer items-center justify-between gap-6 py-1", disabled && "cursor-not-allowed opacity-60")}>
      <span>
        <span className="block text-sm font-semibold text-ink">{label}</span>
        {description && <span className="block text-[13px] text-muted">{description}</span>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn("relative h-7 w-12 shrink-0 rounded-full transition-colors duration-300", checked ? "bg-accent" : "bg-surface-3")}
      >
        <motion.span
          layout
          transition={{ type: "spring", stiffness: 600, damping: 32 }}
          className={cn("absolute top-1 size-5 rounded-full bg-white shadow-soft", checked ? "right-1" : "left-1")}
        />
      </button>
    </label>
  );
}
