"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Formik, Form } from "formik";
import { CreditCard, Wallet, Lock, MailWarning } from "lucide-react";
import { toast } from "sonner";
import { Button, ButtonLink } from "@/components/atoms/Button";
import { FInput, FTextArea } from "@/components/molecules/FormikFields";
import { EmptyState } from "@/components/molecules/EmptyState";
import { shippingAddressSchema } from "@/formik/schema/checkout";
import { api, errorMessage } from "@/interceptor/api";
import { useAppDispatch } from "@/store";
import { clearCart } from "@/store/cart/cartSlice";
import { useCartSync } from "@/resources/hooks/useCartSync";
import { formatMoney } from "@/resources/utils/format";
import { cn } from "@/resources/utils/cn";
import * as yup from "yup";

type Provider = { id: string; label: string; description: string };
type Address = { name: string; phone: string; line1: string; line2: string; city: string; state: string; postalCode: string; country: string };

const formSchema = yup.object({ address: shippingAddressSchema, notes: yup.string().max(1000) });

export function CheckoutTemplate({ providers, defaults, mustVerify }: { providers: Provider[]; defaults: Address; mustVerify: boolean }) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { items, live, loading } = useCartSync();
  const [provider, setProvider] = useState(providers[0]?.id ?? "manual");
  const [resending, setResending] = useState(false);

  const shippingByVendor = new Map<string, number>();
  for (const i of items) {
    const l = live[i.listingId];
    if (l) shippingByVendor.set(l.vendorId, Math.max(shippingByVendor.get(l.vendorId) ?? 0, l.shippingFee));
  }
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const shipping = [...shippingByVendor.values()].reduce((a, b) => a + b, 0);
  const currency = items[0]?.currency ?? "USD";

  if (loading) return <div className="container-x pt-36"><div className="skeleton h-96 rounded-[28px]" /></div>;
  if (items.length === 0) {
    return (
      <div className="container-x pt-36">
        <EmptyState title="Nothing to check out" description="Your cart is empty." action={<ButtonLink href="/explore?type=product">Browse products</ButtonLink>} />
      </div>
    );
  }

  return (
    <div className="container-x pt-28 md:pt-36">
      <h1 className="display-lg text-ink">Checkout</h1>
      {mustVerify && (
        <div className="mt-6 flex flex-col gap-3 rounded-2xl bg-warning-soft p-4 text-sm text-warning sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-2 font-semibold"><MailWarning className="size-4" /> Verify your email to place an order.</p>
          <Button size="sm" variant="secondary" loading={resending} onClick={async () => {
            setResending(true);
            try {
              const r = await api.post<{ delivered?: boolean }>("/auth/resend-verification");
              toast.success(r.delivered === false ? "Verification link printed to the server console (SMTP not configured)." : "Verification email sent.");
            } catch (err) { toast.error(errorMessage(err)); } finally { setResending(false); }
          }}>Resend link</Button>
        </div>
      )}
      <Formik
        initialValues={{ address: defaults, notes: "" }}
        validationSchema={formSchema}
        onSubmit={async (values, { setErrors, setStatus }) => {
          setStatus(undefined);
          try {
            const res = await api.post<{ redirectUrl: string }>("/checkout/cart", {
              items: items.map((i) => ({ listingId: i.listingId, quantity: i.quantity })),
              shippingAddress: values.address,
              provider,
              notes: values.notes,
            });
            dispatch(clearCart());
            if (res.redirectUrl.startsWith("http")) window.location.href = res.redirectUrl;
            else router.push(res.redirectUrl);
          } catch (err) {
            const fields = (err as { fields?: Record<string, string> }).fields;
            if (fields) setErrors(Object.fromEntries(Object.entries(fields).map(([k, v]) => [k.replace("shippingAddress", "address"), v])) as never);
            setStatus(errorMessage(err));
          }
        }}
      >
        {({ isSubmitting, status }) => (
          <Form noValidate className="mt-10 grid gap-8 lg:grid-cols-12">
            <div className="space-y-8 lg:col-span-7">
              <section className="rounded-[28px] border border-line bg-surface p-6 md:p-8">
                <h2 className="font-display text-2xl text-ink">Shipping address</h2>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <FInput name="address.name" label="Full name" autoComplete="name" />
                  <FInput name="address.phone" label="Phone" autoComplete="tel" />
                  <FInput name="address.line1" label="Street address" autoComplete="address-line1" containerClassName="sm:col-span-2" />
                  <FInput name="address.line2" label="Apartment, suite (optional)" autoComplete="address-line2" containerClassName="sm:col-span-2" />
                  <FInput name="address.city" label="City" autoComplete="address-level2" />
                  <FInput name="address.state" label="State / region" autoComplete="address-level1" />
                  <FInput name="address.postalCode" label="Postal code" autoComplete="postal-code" />
                  <FInput name="address.country" label="Country" autoComplete="country-name" />
                </div>
                <FTextArea name="notes" label="Note for the seller (optional)" rows={3} containerClassName="mt-4" />
              </section>
              <section className="rounded-[28px] border border-line bg-surface p-6 md:p-8">
                <h2 className="font-display text-2xl text-ink">Payment</h2>
                <div className="mt-6 space-y-3">
                  {providers.map((p) => (
                    <label key={p.id} className={cn("flex cursor-pointer items-start gap-4 rounded-2xl border p-5 transition", provider === p.id ? "border-accent bg-accent-soft/40 shadow-[0_0_0_3px_var(--ring)]" : "border-line hover:border-line-strong")}>
                      <input type="radio" name="provider" checked={provider === p.id} onChange={() => setProvider(p.id)} className="mt-1 accent-[var(--accent)]" />
                      {p.id === "stripe" ? <CreditCard className="size-6 text-ink-soft" /> : <Wallet className="size-6 text-ink-soft" />}
                      <span>
                        <span className="block font-semibold text-ink">{p.label}</span>
                        <span className="block text-sm text-muted">{p.description}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </section>
            </div>
            <aside className="lg:col-span-5">
              <div className="sticky top-28 rounded-[28px] border border-line bg-surface p-6 md:p-7">
                <h2 className="font-display text-2xl text-ink">Order summary</h2>
                <ul className="mt-6 space-y-4">
                  {items.map((i) => (
                    <li key={i.listingId} className="flex items-center gap-3">
                      <span className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-surface-2">
                        {i.image && <Image src={i.image} alt="" fill sizes="56px" className="object-cover" />}
                        <span className="absolute -top-1 -right-1 grid size-5 place-items-center rounded-full bg-ink text-[11px] font-bold text-bg">{i.quantity}</span>
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="line-clamp-1 text-sm font-semibold text-ink">{i.title}</span>
                        <span className="block text-[12px] text-muted">{live[i.listingId]?.vendorName ?? i.vendorName}</span>
                      </span>
                      <span className="text-sm font-semibold text-ink">{formatMoney(i.price * i.quantity, i.currency)}</span>
                    </li>
                  ))}
                </ul>
                <dl className="mt-6 space-y-2 border-t border-line pt-5 text-sm">
                  <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd>{formatMoney(subtotal, currency)}</dd></div>
                  <div className="flex justify-between"><dt className="text-muted">Shipping</dt><dd>{shipping ? formatMoney(shipping, currency) : "Free"}</dd></div>
                  <div className="flex items-end justify-between pt-3"><dt className="font-semibold text-ink">Total</dt><dd className="font-display text-3xl text-ink">{formatMoney(subtotal + shipping, currency)}</dd></div>
                </dl>
                {status && <p role="alert" className="mt-4 rounded-2xl bg-danger-soft px-4 py-3 text-sm font-medium text-danger">{status}</p>}
                <Button type="submit" size="lg" className="mt-6 w-full" loading={isSubmitting} disabled={mustVerify}>
                  <Lock className="size-4" /> {provider === "stripe" ? "Continue to secure payment" : "Place order"}
                </Button>
                <p className="mt-3 text-center text-[12px] text-muted">Prices and stock are re-checked when you place the order.</p>
              </div>
            </aside>
          </Form>
        )}
      </Formik>
    </div>
  );
}
