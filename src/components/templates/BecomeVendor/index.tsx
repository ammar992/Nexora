"use client";

import { useRouter } from "next/navigation";
import { Formik, Form } from "formik";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Check, Clock, XCircle, Store, CalendarRange, Wallet, BarChart3 } from "lucide-react";
import { Button, ButtonLink } from "@/components/atoms/Button";
import { FInput, FTextArea, applyServerErrors } from "@/components/molecules/FormikFields";
import { Reveal, Stagger, StaggerItem } from "@/components/atoms/Reveal";
import { vendorApplicationSchema } from "@/formik/schema/account";
import { api, errorMessage } from "@/interceptor/api";

type Existing = { status: string; storeName: string; rejectionReason: string; tagline: string; description: string; city: string; country: string; contactEmail: string; contactPhone: string; website: string } | null;

const PERKS = [
  { icon: Store, title: "One storefront", body: "Sell products, take bookings, or both, from a single page customers can follow." },
  { icon: CalendarRange, title: "Live calendar", body: "Set your days, hours, slot length and capacity. Double bookings are prevented automatically." },
  { icon: Wallet, title: "Flexible payments", body: "Accept card payments online or let customers pay you on delivery or at the appointment." },
  { icon: BarChart3, title: "A real dashboard", body: "Orders, bookings, customers, reviews and earnings in one place, on any device." },
];

export function BecomeVendorTemplate({ signedIn, commission, siteName, existing, defaults }: { signedIn: boolean; commission: number; siteName: string; existing: Existing; defaults: { contactEmail: string } }) {
  const router = useRouter();
  const status = existing?.status;

  return (
    <div className="pt-28 md:pt-36">
      <section className="container-x grid gap-14 lg:grid-cols-12">
        <div className="lg:col-span-6">
          <p className="eyebrow">Sell on {siteName}</p>
          <h1 className="display-xl mt-4 text-ink">
            Your work, <em className="text-accent">found.</em>
          </h1>
          <p className="mt-6 max-w-lg text-lg text-muted">
            Apply once and our team reviews your storefront, usually within two business days. There&apos;s no monthly fee: we take {commission}% of each completed sale.
          </p>
          <Stagger className="mt-12 grid gap-4 sm:grid-cols-2">
            {PERKS.map((p) => (
              <StaggerItem key={p.title} className="rounded-3xl border border-line bg-surface p-6">
                <p.icon className="size-6 text-accent" />
                <h2 className="mt-4 font-display text-xl text-ink">{p.title}</h2>
                <p className="mt-2 text-sm text-muted">{p.body}</p>
              </StaggerItem>
            ))}
          </Stagger>
        </div>

        <Reveal className="lg:col-span-6" delay={0.1}>
          <div className="rounded-[32px] border border-line bg-surface p-6 shadow-lift md:p-10 lg:sticky lg:top-28">
            {!signedIn ? (
              <div className="py-6 text-center">
                <h2 className="font-display text-3xl text-ink">Start with an account</h2>
                <p className="mx-auto mt-3 max-w-sm text-muted">Create a free account, then fill in your store details. It takes about five minutes.</p>
                <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                  <ButtonLink href="/register?as=vendor" size="lg">Create account</ButtonLink>
                  <ButtonLink href="/login?next=/become-vendor" size="lg" variant="secondary">I have an account</ButtonLink>
                </div>
              </div>
            ) : status === "approved" ? (
              <StatusCard icon={<Check />} tone="success" title={`${existing!.storeName} is live`} body="Your vendor dashboard is ready. Add your first listing to start selling.">
                <ButtonLink href="/vendor" size="lg">Open vendor dashboard</ButtonLink>
              </StatusCard>
            ) : status === "pending" ? (
              <StatusCard icon={<Clock />} tone="warning" title="Application under review" body={`We're reviewing ${existing!.storeName}. You'll get an email as soon as there's a decision.`} />
            ) : status === "suspended" ? (
              <StatusCard icon={<XCircle />} tone="danger" title="Store suspended" body={existing!.rejectionReason || "Contact support to discuss reinstating your store."} />
            ) : (
              <>
                {status === "rejected" && (
                  <div className="mb-6 rounded-2xl bg-danger-soft p-4 text-sm text-danger">
                    <p className="font-semibold">Your previous application wasn&apos;t approved.</p>
                    {existing!.rejectionReason && <p className="mt-1">Reviewer note: {existing!.rejectionReason}</p>}
                    <p className="mt-1">Update the details below and apply again.</p>
                  </div>
                )}
                <h2 className="font-display text-3xl text-ink">Tell us about your store</h2>
                <Formik
                  initialValues={{
                    storeName: existing?.storeName ?? "",
                    tagline: existing?.tagline ?? "",
                    description: existing?.description ?? "",
                    city: existing?.city ?? "",
                    country: existing?.country ?? "",
                    contactEmail: existing?.contactEmail || defaults.contactEmail,
                    contactPhone: existing?.contactPhone ?? "",
                    website: existing?.website ?? "",
                  }}
                  validationSchema={vendorApplicationSchema}
                  onSubmit={async (values, { setErrors }) => {
                    try {
                      const res = await api.post<{ status: string }>("/vendor/apply", values);
                      toast.success(res.status === "approved" ? "Your store is live!" : "Application submitted");
                      router.refresh();
                      if (res.status === "approved") router.push("/vendor");
                    } catch (err) {
                      applyServerErrors(err, setErrors);
                      toast.error(errorMessage(err));
                    }
                  }}
                >
                  {({ isSubmitting }) => (
                    <Form className="mt-6 grid gap-4 sm:grid-cols-2" noValidate>
                      <FInput name="storeName" label="Store name" containerClassName="sm:col-span-2" />
                      <FInput name="tagline" label="Tagline (optional)" maxLength={140} containerClassName="sm:col-span-2" />
                      <FTextArea name="description" label="What do you make or offer?" rows={4} containerClassName="sm:col-span-2" />
                      <FInput name="city" label="City" />
                      <FInput name="country" label="Country" />
                      <FInput name="contactEmail" type="email" label="Contact email" />
                      <FInput name="contactPhone" label="Phone (optional)" />
                      <FInput name="website" label="Website or portfolio (optional)" placeholder="https://" containerClassName="sm:col-span-2" />
                      <Button type="submit" size="lg" className="sm:col-span-2" loading={isSubmitting}>
                        Submit application
                      </Button>
                    </Form>
                  )}
                </Formik>
              </>
            )}
          </div>
        </Reveal>
      </section>
    </div>
  );
}

function StatusCard({ icon, title, body, tone, children }: { icon: React.ReactNode; title: string; body: string; tone: "success" | "warning" | "danger"; children?: React.ReactNode }) {
  const tones = { success: "bg-success-soft text-success", warning: "bg-warning-soft text-warning", danger: "bg-danger-soft text-danger" };
  return (
    <div className="py-6 text-center">
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 15 }} className={`mx-auto grid size-16 place-items-center rounded-full [&_svg]:size-8 ${tones[tone]}`}>
        {icon}
      </motion.div>
      <h2 className="mt-6 font-display text-3xl text-ink">{title}</h2>
      <p className="mx-auto mt-3 max-w-sm text-muted">{body}</p>
      {children && <div className="mt-8">{children}</div>}
    </div>
  );
}
