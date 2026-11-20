"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Formik, Form } from "formik";
import { toast } from "sonner";
import { Send, Palette, Home, Percent, Phone, Share2, Mail } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { Switch } from "@/components/atoms/Field";
import { Badge } from "@/components/atoms/Badge";
import { FInput, FTextArea } from "@/components/molecules/FormikFields";
import { SingleImageUpload } from "@/components/molecules/ImageUploader";
import { Tabs } from "@/components/molecules/Tabs";
import { Panel } from "@/components/organisms/dashboard/PageHeader";
import { settingsSchema, type SettingsInput } from "@/formik/schema/admin";
import { api, errorMessage } from "@/interceptor/api";

type Section = "branding" | "homepage" | "commerce" | "contact" | "email";

export function SettingsForm({ initial, env }: { initial: SettingsInput; env: { smtp: boolean; stripe: boolean; cloudinary: boolean; smtpHost: string } }) {
  const router = useRouter();
  const [tab, setTab] = useState<Section>("branding");
  const [testing, setTesting] = useState(false);

  return (
    <Formik
      initialValues={initial}
      validationSchema={settingsSchema}
      onSubmit={async (values, { resetForm, setErrors }) => {
        try {
          await api.put("/admin/settings", values);
          toast.success("Settings saved");
          resetForm({ values });
          router.refresh();
        } catch (err) {
          const fields = (err as { fields?: Record<string, string> }).fields;
          if (fields) setErrors(fields as never);
          toast.error(errorMessage(err));
        }
      }}
    >
      {({ values, setFieldValue, isSubmitting, dirty, errors, submitCount }) => (
        <Form noValidate>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <Tabs id="settings" value={tab} onChange={setTab} items={[
              { value: "branding", label: <><Palette className="size-3.5" /> Branding</> },
              { value: "homepage", label: <><Home className="size-3.5" /> Homepage</> },
              { value: "commerce", label: <><Percent className="size-3.5" /> Commerce</> },
              { value: "contact", label: <><Phone className="size-3.5" /> Contact & social</> },
              { value: "email", label: <><Mail className="size-3.5" /> Email</> },
            ]} />
            <Button type="submit" loading={isSubmitting} disabled={!dirty}>Save settings</Button>
          </div>
          {submitCount > 0 && Object.keys(errors).length > 0 && <p className="mb-4 rounded-2xl bg-danger-soft px-4 py-3 text-sm text-danger">Some fields need attention: {Object.keys(errors).join(", ")}.</p>}

          {tab === "branding" && (
            <Panel title="Branding">
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="space-y-4">
                  <FInput name="siteName" label="Site name" />
                  <FInput name="tagline" label="Tagline" maxLength={160} />
                </div>
                <div className="space-y-5">
                  <SingleImageUpload value={values.logoUrl} onChange={(u) => setFieldValue("logoUrl", u)} folder="branding" label="Logo (square works best)" shape="square" />
                  <SingleImageUpload value={values.faviconUrl} onChange={(u) => setFieldValue("faviconUrl", u)} folder="branding" label="Favicon (PNG, 64×64+)" shape="square" />
                </div>
              </div>
            </Panel>
          )}

          {tab === "homepage" && (
            <div className="grid gap-6 xl:grid-cols-2">
              <Panel title="Hero">
                <div className="space-y-4">
                  <FInput name="homepage.heroEyebrow" label="Eyebrow" maxLength={80} />
                  <FInput name="homepage.heroTitle" label="Headline" maxLength={120} hint="Use two short sentences: the second one is set in italic accent." />
                  <FTextArea name="homepage.heroSubtitle" label="Subheading" rows={3} maxLength={300} />
                </div>
              </Panel>
              <Panel title="Vendor promo section">
                <div className="space-y-4">
                  <FInput name="homepage.promoTitle" label="Title" maxLength={100} />
                  <FTextArea name="homepage.promoText" label="Text" rows={3} maxLength={300} />
                  <FInput name="homepage.promoCta" label="Button label" maxLength={40} />
                </div>
              </Panel>
            </div>
          )}

          {tab === "commerce" && (
            <Panel title="Commerce">
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="space-y-4">
                  <FInput name="commissionRate" type="number" min={0} max={60} step="0.5" label="Platform commission (%)" hint="Applied to new orders and bookings. Existing ones keep their rate." />
                  <FInput name="currency" label="Currency (ISO code)" maxLength={3} />
                </div>
                <div className="space-y-5">
                  <Switch label="Auto-approve listings" description="Publish vendor listings without review." checked={values.autoApproveListings} onChange={(v) => setFieldValue("autoApproveListings", v)} />
                  <Switch label="Auto-approve vendors" description="Open new storefronts without review." checked={values.autoApproveVendors} onChange={(v) => setFieldValue("autoApproveVendors", v)} />
                  <div className="rounded-2xl bg-surface-2 p-4 text-sm">
                    <p className="font-semibold text-ink">Payment providers</p>
                    <p className="mt-1 flex items-center gap-2 text-muted">Stripe (cards): {env.stripe ? <Badge tone="success">Configured</Badge> : <Badge tone="warning">Set STRIPE_SECRET_KEY</Badge>}</p>
                    <p className="mt-1 flex items-center gap-2 text-muted">Pay on delivery / in person: <Badge tone="success">Always on</Badge></p>
                  </div>
                </div>
              </div>
            </Panel>
          )}

          {tab === "contact" && (
            <div className="grid gap-6 xl:grid-cols-2">
              <Panel title="Contact information">
                <div className="space-y-4">
                  <FInput name="contact.email" type="email" label="Support email" hint="Contact form messages are sent here." />
                  <FInput name="contact.phone" label="Phone" />
                  <FTextArea name="contact.address" label="Address" rows={2} />
                </div>
              </Panel>
              <Panel title="Social links">
                <div className="space-y-4">
                  {(["instagram", "x", "facebook", "linkedin", "youtube"] as const).map((k) => (
                    <FInput key={k} name={`social.${k}`} label={k === "x" ? "X (Twitter)" : k[0].toUpperCase() + k.slice(1)} placeholder="https://" icon={<Share2 />} />
                  ))}
                </div>
              </Panel>
            </div>
          )}

          {tab === "email" && (
            <div className="grid gap-6 xl:grid-cols-2">
              <Panel title="Sender">
                <div className="space-y-4">
                  <FInput name="email.fromName" label="From name" />
                  <FInput name="email.replyTo" type="email" label="Reply-to address (optional)" />
                </div>
              </Panel>
              <Panel title="SMTP connection">
                <p className="text-sm text-muted">SMTP credentials live in environment variables so they&apos;re never stored in the database or sent to the browser.</p>
                <p className="mt-4 flex items-center gap-2 text-sm">Status: {env.smtp ? <Badge tone="success">Connected to {env.smtpHost}</Badge> : <Badge tone="warning">Not configured, emails print to the server console</Badge>}</p>
                <pre className="mt-4 overflow-x-auto rounded-2xl bg-ink p-4 text-[12px] leading-relaxed text-bg">{`SMTP_HOST=smtp.yourprovider.com\nSMTP_PORT=587\nSMTP_USER=you@yourdomain.com\nSMTP_PASSWORD=••••••••\nSMTP_FROM="Nexora <hello@yourdomain.com>"`}</pre>
                <Button type="button" variant="secondary" className="mt-4" loading={testing} onClick={async () => {
                  setTesting(true);
                  try {
                    const r = await api.post<{ sentTo: string }>("/admin/settings/test-email");
                    toast.success(`Test email sent to ${r.sentTo}`);
                  } catch (err) { toast.error(errorMessage(err)); } finally { setTesting(false); }
                }}><Send className="size-4" /> Send test email</Button>
              </Panel>
            </div>
          )}
        </Form>
      )}
    </Formik>
  );
}
