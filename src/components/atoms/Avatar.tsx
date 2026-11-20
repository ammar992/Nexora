import Image from "next/image";
import { cn } from "@/resources/utils/cn";
import { initials } from "@/resources/utils/format";

const PALETTE = ["#d24f26", "#2c6187", "#2c7a57", "#8a5a2b", "#6b4c8a", "#a8670f"];

export function Avatar({ name, src, size = 40, className }: { name: string; src?: string | null; size?: number; className?: string }) {
  const color = PALETTE[(name.charCodeAt(0) + name.length) % PALETTE.length];
  return (
    <span
      className={cn("relative inline-grid shrink-0 place-items-center overflow-hidden rounded-full font-semibold text-white", className)}
      style={{ width: size, height: size, background: src ? undefined : color, fontSize: size * 0.38 }}
    >
      {src ? <Image src={src} alt={name} fill sizes={`${size}px`} className="object-cover" /> : <span aria-hidden>{initials(name) || "?"}</span>}
      {!src && <span className="sr-only">{name}</span>}
    </span>
  );
}
