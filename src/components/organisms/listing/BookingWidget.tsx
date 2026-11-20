"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Users, CalendarDays, Clock, CreditCard, Wallet } from "lucide-react";
import { Formik, Form } from "formik";
import * as yup from "yup";
import { toast } from "sonner";
import { Button } from "@/components/atoms/Button";
import { Modal } from "@/components/molecules/Modal";
import { QuantityStepper } from "@/components/molecules/QuantityStepper";
import { FInput, FTextArea, applyServerErrors } from "@/components/molecules/FormikFields";
import { api, errorMessage } from "@/interceptor/api";
import { useSession } from "@/context/SessionContext";
import { isDateBookable, toDateKey, WEEKDAYS, type AvailabilityRules } from "@/resources/utils/slots";
import { formatDate, formatMoney, formatTime } from "@/resources/utils/format";
import { cn } from "@/resources/utils/cn";

type Slot = { time: string; remaining: number; available: boolean };
type Provider = { id: string; label: string; description: string };

const contactSchema = yup.object({
  name: yup.string().trim().min(2, "Your name is required").required("Your name is required"),
  email: yup.string().trim().email("Enter a valid email").required("Email is required"),
  phone: yup.string().trim().max(30).matches(/^[+\d\s()-]*$/, "Use digits, spaces and + ( ) - only"),
  notes: yup.string().trim().max(1000),
});

export function BookingWidget({ listing, rules, providers, disabled }: { listing: { _id: string; slug: string; title: string; price: number; priceUnit: string; currency: string; durationMinutes?: number }; rules: AvailabilityRules; providers: Provider[]; disabled?: string }) {
  const { user } = useSession();
  const router = useRouter();
  const today = useMemo(() => new Date(), []);
  const [month, setMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [date, setDate] = useState<string>("");
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [time, setTime] = useState("");
  const [guests, setGuests] = useState(1);
  const [open, setOpen] = useState(false);
  const [provider, setProvider] = useState(providers[0]?.id ?? "manual");

  useEffect(() => {
    if (!date) return;
    let cancelled = false;
    api
      .get<{ slots: Slot[] }>(`/listings/${listing._id}/availability`, { date })
      .then((r) => !cancelled && setSlots(r.slots))
      .catch((err) => !cancelled && (toast.error(errorMessage(err)), setSlots([])))
      .finally(() => !cancelled && setLoadingSlots(false));
    return () => {
      cancelled = true;
    };
  }, [date, listing._id]);

  const days = useMemo(() => {
    const first = new Date(month);
    const offset = first.getDay();
    const total = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    return [...Array(offset).fill(null), ...Array.from({ length: total }, (_, i) => new Date(month.getFullYear(), month.getMonth(), i + 1))];
  }, [month]);

  const maxMonth = new Date(today.getFullYear(), today.getMonth(), today.getDate() + rules.maxAdvanceDays);
  const canPrev = month > new Date(today.getFullYear(), today.getMonth(), 1);
  const canNext = new Date(month.getFullYear(), month.getMonth() + 1, 1) <= maxMonth;
  const total = listing.priceUnit === "person" ? listing.price * guests : listing.price;
  const selected = slots?.find((s) => s.time === time);
  const maxGuests = Math.max(1, Math.min(selected?.remaining ?? rules.capacityPerSlot, 50));

  function proceed() {
    if (!user) {
      router.push(`/login?next=${encodeURIComponent(`/listing/${listing.slug}`)}`);
      return;
    }
    setOpen(true);
  }

  if (disabled) return <p className="rounded-2xl bg-surface-2 px-4 py-3 text-sm text-muted">{disabled}</p>;

  return (
    <div>
      {/* Calendar */}
      <div className="rounded-3xl border border-line bg-surface p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="font-display text-lg text-ink">{month.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</p>
          <div className="flex gap-1">
            <button type="button" disabled={!canPrev} onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} className="grid size-9 place-items-center rounded-full hover:bg-surface-2 disabled:opacity-30" aria-label="Previous month">
              <ChevronLeft className="size-4" />
            </button>
            <button type="button" disabled={!canNext} onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} className="grid size-9 place-items-center rounded-full hover:bg-surface-2 disabled:opacity-30" aria-label="Next month">
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center" role="grid" aria-label="Choose a date">
          {WEEKDAYS.map((d) => (
            <span key={d} className="pb-1 text-[11px] font-bold tracking-wide text-muted uppercase">
              {d.slice(0, 2)}
            </span>
          ))}
          {days.map((d, i) => {
            if (!d) return <span key={`b${i}`} />;
            const key = toDateKey(d);
            const ok = isDateBookable(key, rules, today);
            const active = key === date;
            return (
              <button key={key} type="button" disabled={!ok} onClick={() => { if (key === date) return; setDate(key); setTime(""); setLoadingSlots(true); }} aria-pressed={active} aria-label={formatDate(key, { weekday: "long" })} className={cn("relative grid aspect-square place-items-center rounded-full text-sm font-semibold transition", ok ? "text-ink hover:bg-surface-2" : "text-muted/40 line-through decoration-1", active && "text-accent-ink")}>
                {active && <motion.span layoutId="day-pill" className="absolute inset-0 rounded-full bg-accent" transition={{ type: "spring", stiffness: 500, damping: 35 }} />}
                <span className="relative">{d.getDate()}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Slots */}
      <AnimatePresence mode="wait">
        {date && (
          <motion.div key={date} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <p className="mt-5 mb-3 text-sm font-semibold text-ink">{formatDate(date, { weekday: "long", year: undefined })}</p>
            {loadingSlots ? (
              <div className="grid grid-cols-3 gap-2">{[0, 1, 2, 3, 4, 5].map((i) => <div key={i} className="skeleton h-11" />)}</div>
            ) : slots && slots.filter((s) => s.available).length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {slots.map((s) => (
                  <motion.button key={s.time} type="button" whileTap={{ scale: 0.95 }} disabled={!s.available} onClick={() => setTime(s.time)} aria-pressed={time === s.time} className={cn("h-11 rounded-2xl border text-sm font-semibold transition", time === s.time ? "border-ink bg-ink text-bg" : s.available ? "border-line bg-surface text-ink hover:border-ink" : "border-line text-muted/50 line-through")}>
                    {formatTime(s.time)}
                  </motion.button>
                ))}
              </div>
            ) : (
              <p className="rounded-2xl bg-surface-2 px-4 py-3 text-sm text-muted">No open times on this day. Try another date.</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {rules.capacityPerSlot > 1 && (
        <div className="mt-5 flex items-center justify-between">
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-ink">
            <Users className="size-4" /> Guests
          </span>
          <QuantityStepper value={Math.min(guests, maxGuests)} onChange={setGuests} max={maxGuests} size="sm" />
        </div>
      )}

      <div className="mt-6 flex items-end justify-between border-t border-line pt-5">
        <span className="text-sm text-muted">Total</span>
        <span className="font-display text-3xl text-ink">{formatMoney(total, listing.currency)}</span>
      </div>
      <Button size="lg" className="mt-4 w-full" disabled={!date || !time} onClick={proceed}>
        <CalendarDays className="size-[18px]" /> {date && time ? `Book ${formatTime(time)}` : "Pick a date and time"}
      </Button>

      <Modal open={open} onClose={() => setOpen(false)} title="Confirm your booking" description={`${listing.title} · ${date ? formatDate(date, { weekday: "short" }) : ""} at ${time ? formatTime(time) : ""}`}>
        <Formik
          initialValues={{ name: user?.name ?? "", email: user?.email ?? "", phone: "", notes: "" }}
          validationSchema={contactSchema}
          onSubmit={async (values, { setErrors, setStatus }) => {
            try {
              const res = await api.post<{ redirectUrl: string }>("/checkout/booking", {
                listingId: listing._id,
                date,
                timeSlot: time,
                guests: Math.min(guests, maxGuests),
                contact: { name: values.name, email: values.email, phone: values.phone },
                notes: values.notes,
                provider,
              });
              if (res.redirectUrl.startsWith("http")) window.location.href = res.redirectUrl;
              else router.push(res.redirectUrl);
            } catch (err) {
              applyServerErrors(err, setErrors);
              setStatus(errorMessage(err));
            }
          }}
        >
          {({ isSubmitting, status }) => (
            <Form className="space-y-4" noValidate>
              {status && <p role="alert" className="rounded-2xl bg-danger-soft px-4 py-3 text-sm font-medium text-danger">{status}</p>}
              <div className="grid gap-4 sm:grid-cols-2">
                <FInput name="name" label="Name" autoComplete="name" />
                <FInput name="phone" label="Phone (optional)" autoComplete="tel" />
              </div>
              <FInput name="email" type="email" label="Email" autoComplete="email" />
              <FTextArea name="notes" label="Anything the vendor should know? (optional)" rows={3} />
              <fieldset>
                <legend className="eyebrow mb-2">Payment</legend>
                <div className="space-y-2">
                  {providers.map((p) => (
                    <label key={p.id} className={cn("flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition", provider === p.id ? "border-accent bg-accent-soft/50" : "border-line hover:border-line-strong")}>
                      <input type="radio" name="provider" value={p.id} checked={provider === p.id} onChange={() => setProvider(p.id)} className="mt-1 accent-[var(--accent)]" />
                      {p.id === "stripe" ? <CreditCard className="mt-0.5 size-5 text-ink-soft" /> : <Wallet className="mt-0.5 size-5 text-ink-soft" />}
                      <span>
                        <span className="block text-sm font-semibold text-ink">{p.label}</span>
                        <span className="block text-[13px] text-muted">{p.description}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <div className="flex items-center justify-between rounded-2xl bg-surface-2 px-4 py-3 text-sm">
                <span className="inline-flex items-center gap-2 text-muted">
                  <Clock className="size-4" /> {listing.durationMinutes ? `${listing.durationMinutes} min` : "Session"}
                  {guests > 1 && ` · ${Math.min(guests, maxGuests)} guests`}
                </span>
                <span className="font-semibold text-ink">{formatMoney(total, listing.currency)}</span>
              </div>
              <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>
                {provider === "stripe" ? "Continue to payment" : "Request booking"}
              </Button>
            </Form>
          )}
        </Formik>
      </Modal>
    </div>
  );
}
