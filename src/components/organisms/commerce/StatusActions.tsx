"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Truck, CheckCircle2, XCircle, RotateCcw, Banknote, PackageCheck, CalendarCheck } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Field";
import { ConfirmDialog } from "@/components/molecules/ConfirmDialog";
import { Modal } from "@/components/molecules/Modal";
import { api, errorMessage } from "@/interceptor/api";
import { BOOKING_TRANSITIONS, ORDER_TRANSITIONS, STATUS_META } from "@/resources/utils/constant";
import type { Audience } from "./types";

type Props = {
  kind: "order" | "booking";
  id: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  audience: Audience;
  /** Booking start, used to hide "completed" until it has started. */
  startsAt?: string;
  onDone?: () => void;
};

const ICONS: Record<string, React.ReactNode> = {
  processing: <PackageCheck className="size-4" />,
  shipped: <Truck className="size-4" />,
  delivered: <CheckCircle2 className="size-4" />,
  confirmed: <CalendarCheck className="size-4" />,
  completed: <CheckCircle2 className="size-4" />,
  cancelled: <XCircle className="size-4" />,
  refunded: <RotateCcw className="size-4" />,
};

const LABELS: Record<string, string> = {
  processing: "Mark as processing",
  shipped: "Mark as shipped",
  delivered: "Mark as delivered",
  confirmed: "Confirm booking",
  completed: "Mark completed",
  cancelled: "Cancel",
  refunded: "Issue refund",
};

/** Buttons for the status changes this viewer is allowed to make. The server re-validates every change. */
export function StatusActions({ kind, id, status, paymentStatus, paymentMethod, audience, startsAt, onDone }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<string | null>(null);
  const [shipOpen, setShipOpen] = useState(false);
  const [tracking, setTracking] = useState("");
  const [now] = useState(() => Date.now());

  const transitions = (kind === "order" ? ORDER_TRANSITIONS : BOOKING_TRANSITIONS)[status] ?? [];
  let allowed = transitions;
  if (audience === "customer") allowed = transitions.filter((t) => t === "cancelled" && (kind === "booking" || ["pending_payment", "processing"].includes(status)));
  if (audience === "vendor") allowed = transitions.filter((t) => t !== "refunded");
  if (kind === "booking" && startsAt && new Date(startsAt).getTime() > now) allowed = allowed.filter((t) => t !== "completed");
  if (kind === "order" && status === "pending_payment" && paymentMethod !== "manual") allowed = allowed.filter((t) => t !== "processing");

  const canRecordPayment = audience !== "customer" && paymentMethod === "manual" && paymentStatus === "unpaid" && !["cancelled", "refunded"].includes(status);

  async function change(next: string, note = "", trackingNumber = "") {
    setBusy(next);
    try {
      const res = await api.patch<{ status: string }>(`/${kind}s/${id}/status`, { status: next, note, trackingNumber });
      toast.success(`${kind === "order" ? "Order" : "Booking"} is now ${STATUS_META[res.status]?.label.toLowerCase() ?? res.status}`);
      router.refresh();
      onDone?.();
    } catch (err) {
      toast.error(errorMessage(err));
      throw err;
    } finally {
      setBusy(null);
    }
  }

  async function recordPayment() {
    setBusy("payment");
    try {
      await api.post(`/${kind}s/${id}/payment`);
      toast.success("Payment recorded");
      router.refresh();
      onDone?.();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(null);
    }
  }

  if (!allowed.length && !canRecordPayment) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {canRecordPayment && (
        <Button size="sm" variant="soft" loading={busy === "payment"} onClick={recordPayment}>
          <Banknote className="size-4" /> Record payment received
        </Button>
      )}
      {allowed.map((t) => {
        const destructive = t === "cancelled" || t === "refunded";
        const label = audience === "customer" && t === "cancelled" ? `Cancel ${kind}` : t === "cancelled" && paymentStatus === "paid" ? "Cancel & refund" : LABELS[t] ?? t;
        return (
          <Button
            key={t}
            size="sm"
            variant={destructive ? "secondary" : "dark"}
            className={destructive ? "!text-danger" : undefined}
            loading={busy === t}
            onClick={() => (destructive ? setConfirm(t) : t === "shipped" ? setShipOpen(true) : change(t))}
          >
            {ICONS[t]} {label}
          </Button>
        );
      })}

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        tone="danger"
        title={confirm === "refunded" ? "Refund this payment?" : `Cancel this ${kind}?`}
        description={paymentStatus === "paid" ? "The customer will be refunded through the original payment method." : audience === "customer" ? "The vendor will be notified." : "The customer will be notified by email."}
        confirmLabel={confirm === "refunded" ? "Issue refund" : `Cancel ${kind}`}
        withReason
        reasonLabel={audience === "customer" ? "Reason (optional)" : "Reason (shared with the customer)"}
        onConfirm={async (reason) => {
          if (confirm) await change(confirm, reason);
        }}
      />
      <Modal open={shipOpen} onClose={() => setShipOpen(false)} title="Mark as shipped" description="Add a tracking number so the customer can follow the parcel." size="sm">
        <Input label="Tracking number (optional)" value={tracking} onChange={(e) => setTracking(e.target.value)} maxLength={80} />
        <Button
          className="mt-5 w-full"
          size="lg"
          loading={busy === "shipped"}
          onClick={async () => {
            await change("shipped", "", tracking.trim()).catch(() => {});
            setShipOpen(false);
          }}
        >
          <Truck className="size-4" /> Confirm shipped
        </Button>
      </Modal>
    </div>
  );
}
