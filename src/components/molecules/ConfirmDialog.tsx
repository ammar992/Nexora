"use client";

import { useState } from "react";
import { Modal } from "./Modal";
import { Button } from "@/components/atoms/Button";
import { TextArea } from "@/components/atoms/Field";

/** Confirmation dialog; optionally collects a reason (e.g. for rejections or cancellations). */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  tone = "primary",
  withReason,
  reasonLabel = "Reason (shared with the user)",
  reasonRequired,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void> | void;
  title: string;
  description?: string;
  confirmLabel?: string;
  tone?: "primary" | "danger";
  withReason?: boolean;
  reasonLabel?: string;
  reasonRequired?: boolean;
}) {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function confirm() {
    if (reasonRequired && reason.trim().length < 3) {
      setError("Please add a short reason");
      return;
    }
    setBusy(true);
    try {
      await onConfirm(reason.trim());
      setReason("");
      onClose();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={busy ? () => {} : onClose} title={title} description={description} size="sm">
      {withReason && (
        <TextArea
          label={reasonLabel}
          value={reason}
          rows={3}
          maxLength={500}
          error={error}
          onChange={(e) => {
            setReason(e.target.value);
            setError("");
          }}
          containerClassName="mb-6"
        />
      )}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button variant="ghost" onClick={onClose} disabled={busy}>
          Keep as is
        </Button>
        <Button variant={tone === "danger" ? "danger" : "primary"} onClick={confirm} loading={busy}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
