"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import { api, errorMessage } from "@/interceptor/api";
import { Reveal } from "@/components/atoms/Reveal";

export function Newsletter() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done">("idle");
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError("Enter a valid email address");
      return;
    }
    setState("busy");
    setError("");
    try {
      await api.post("/newsletter", { email });
      setState("done");
    } catch (err) {
      setError(errorMessage(err));
      setState("idle");
    }
  }

  return (
    <Reveal className="container-x">
      <div className="grain relative overflow-hidden rounded-[36px] border border-line bg-surface-2 px-6 py-14 md:px-14 md:py-20">
        <div className="grid items-end gap-10 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <p className="eyebrow">The Sunday edit</p>
            <h2 className="display-lg mt-4 text-ink">New makers, worth knowing.</h2>
            <p className="mt-4 max-w-md text-muted">One short email a week with the vendors who just joined and the pieces customers are loving. Unsubscribe whenever you like.</p>
          </div>
          <form onSubmit={submit} className="relative lg:col-span-6" noValidate>
            <AnimatePresence mode="wait">
              {state === "done" ? (
                <motion.p key="done" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 font-display text-2xl text-ink">
                  <span className="grid size-10 place-items-center rounded-full bg-success text-white">
                    <Check className="size-5" />
                  </span>
                  You&apos;re on the list.
                </motion.p>
              ) : (
                <motion.div key="form" exit={{ opacity: 0, y: -10 }}>
                  <label htmlFor="nl-email" className="sr-only">Email address</label>
                  <div className={`flex items-center gap-2 border-b-2 pb-3 transition-colors ${error ? "border-danger" : "border-ink focus-within:border-accent"}`}>
                    <input id="nl-email" type="email" value={email} onChange={(e) => { setEmail(e.target.value); setError(""); }} placeholder="you@example.com" className="w-full min-w-0 bg-transparent font-display text-2xl text-ink outline-none placeholder:text-muted/60 md:text-3xl" />
                    <motion.button whileHover={{ x: 3 }} whileTap={{ scale: 0.92 }} type="submit" disabled={state === "busy"} className="grid size-12 shrink-0 place-items-center rounded-full bg-ink text-bg transition hover:bg-accent disabled:opacity-50" aria-label="Subscribe">
                      <ArrowRight className="size-5" />
                    </motion.button>
                  </div>
                  {error && <p className="pt-2 text-sm font-medium text-danger">{error}</p>}
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </div>
      </div>
    </Reveal>
  );
}
