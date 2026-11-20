"use client";

import { useEffect } from "react";
import { RotateCcw } from "lucide-react";

export default function ErrorBoundary({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <main id="main" className="grid min-h-[80dvh] place-items-center px-4">
      <div className="max-w-md text-center">
        <p className="eyebrow">Something went wrong</p>
        <h1 className="mt-3 font-display text-4xl text-ink">We couldn&apos;t load this page.</h1>
        <p className="mt-3 text-muted">It&apos;s probably temporary. Try again, and if it keeps happening let us know{error.digest ? ` (ref ${error.digest})` : ""}.</p>
        <button type="button" onClick={reset} className="mt-8 inline-flex h-12 items-center gap-2 rounded-full bg-ink px-6 text-sm font-semibold text-bg">
          <RotateCcw className="size-4" /> Try again
        </button>
      </div>
    </main>
  );
}
