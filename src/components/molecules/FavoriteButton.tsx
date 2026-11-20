"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { api, errorMessage } from "@/interceptor/api";
import { useSession } from "@/context/SessionContext";
import { cn } from "@/resources/utils/cn";

export function FavoriteButton({ listingId, initial, className, variant = "floating" }: { listingId: string; initial: boolean; className?: string; variant?: "floating" | "inline" }) {
  const { user } = useSession();
  const router = useRouter();
  const [saved, setSaved] = useState(initial);
  const [busy, setBusy] = useState(false);

  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    if (busy) return;
    setBusy(true);
    setSaved((s) => !s); // optimistic
    try {
      const res = await api.post<{ saved: boolean }>("/favorites", { listingId });
      setSaved(res.saved);
      toast.success(res.saved ? "Saved to your list" : "Removed from saved");
    } catch (err) {
      setSaved((s) => !s);
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <motion.button
      type="button"
      onClick={toggle}
      whileTap={{ scale: 0.85 }}
      aria-pressed={saved}
      aria-label={saved ? "Remove from saved" : "Save for later"}
      className={cn(
        "relative grid place-items-center rounded-full transition-colors",
        variant === "floating" ? "glass size-10 text-ink shadow-soft hover:text-accent" : "size-11 border border-line bg-surface text-ink hover:border-accent hover:text-accent",
        className
      )}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span key={saved ? "on" : "off"} initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.4, opacity: 0 }} transition={{ type: "spring", stiffness: 600, damping: 20 }}>
          <Heart className={cn("size-[18px]", saved && "text-accent")} fill={saved ? "currentColor" : "none"} strokeWidth={2} />
        </motion.span>
      </AnimatePresence>
    </motion.button>
  );
}
