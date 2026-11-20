"use client";

import { useState } from "react";
import { MailWarning } from "lucide-react";
import { toast } from "sonner";
import { api, errorMessage } from "@/interceptor/api";

export function VerifyBanner({ email }: { email: string }) {
  const [busy, setBusy] = useState(false);
  return (
    <div className="flex flex-col gap-2 border-b border-warning/30 bg-warning-soft px-4 py-3 text-sm text-warning sm:flex-row sm:items-center sm:justify-between md:px-8">
      <p className="flex items-center gap-2 font-semibold">
        <MailWarning className="size-4 shrink-0" /> Verify {email} to check out and book.
      </p>
      <button
        type="button"
        disabled={busy}
        className="self-start font-bold underline underline-offset-4 disabled:opacity-50 sm:self-auto"
        onClick={async () => {
          setBusy(true);
          try {
            const r = await api.post<{ delivered?: boolean; alreadyVerified?: boolean }>("/auth/resend-verification");
            toast.success(r.alreadyVerified ? "Already verified." : r.delivered === false ? "SMTP isn't configured: the link was printed to the server console." : "Verification email sent.");
          } catch (err) {
            toast.error(errorMessage(err));
          } finally {
            setBusy(false);
          }
        }}
      >
        Resend verification email
      </button>
    </div>
  );
}
