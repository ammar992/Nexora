"use client";

import Link from "next/link";
import { forwardRef } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/resources/utils/cn";
import { Spinner } from "./Spinner";

type Variant = "primary" | "dark" | "secondary" | "ghost" | "outline" | "danger" | "soft";
type Size = "sm" | "md" | "lg" | "icon" | "icon-sm";

const base =
  "relative inline-flex select-none items-center justify-center gap-2 overflow-hidden whitespace-nowrap rounded-full font-semibold tracking-[-0.01em] transition-[background-color,color,box-shadow,border-color,opacity] duration-200 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

const variants: Record<Variant, string> = {
  primary: "sheen text-accent-ink shadow-[0_8px_24px_-10px_var(--accent)] hover:shadow-[0_14px_30px_-10px_var(--accent)]",
  dark: "bg-ink text-bg hover:bg-ink-soft",
  secondary: "border border-line bg-surface text-ink shadow-soft hover:border-line-strong hover:bg-surface-2",
  outline: "border border-ink/80 text-ink hover:bg-ink hover:text-bg",
  ghost: "text-ink-soft hover:bg-surface-2 hover:text-ink",
  soft: "bg-accent-soft text-accent hover:bg-accent hover:text-accent-ink",
  danger: "bg-danger text-white hover:opacity-90",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-[13px]",
  md: "h-11 px-5 text-sm",
  lg: "h-14 px-7 text-[15px]",
  icon: "size-11",
  "icon-sm": "size-9",
};

export type ButtonProps = Omit<HTMLMotionProps<"button">, "children"> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  children?: React.ReactNode;
};

/** Animated button: lifts on hover, compresses on press, shows a spinner while loading. */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", loading, disabled, className, children, type = "button", ...rest },
  ref
) {
  return (
    <motion.button
      ref={ref}
      type={type}
      whileHover={disabled || loading ? undefined : { y: -1.5 }}
      whileTap={disabled || loading ? undefined : { scale: 0.96, y: 0 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(base, variants[variant], sizes[size], className)}
      {...rest}
    >
      <span className={cn("inline-flex items-center gap-2 transition-opacity", loading && "opacity-0")}>{children}</span>
      {loading && (
        <span className="absolute inset-0 grid place-items-center">
          <Spinner />
        </span>
      )}
    </motion.button>
  );
});

type ButtonLinkProps = { href: string; variant?: Variant; size?: Size; className?: string; children: React.ReactNode; prefetch?: boolean } & Omit<
  React.AnchorHTMLAttributes<HTMLAnchorElement>,
  "href"
>;

const MotionLink = motion.create(Link);

export function ButtonLink({ href, variant = "primary", size = "md", className, children, ...rest }: ButtonLinkProps) {
  return (
    <MotionLink
      href={href}
      whileHover={{ y: -1.5 }}
      whileTap={{ scale: 0.96, y: 0 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className={cn(base, variants[variant], sizes[size], className)}
      {...(rest as object)}
    >
      {children}
    </MotionLink>
  );
}
