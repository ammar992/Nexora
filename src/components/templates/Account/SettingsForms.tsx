"use client";

import { useState } from "react";
import { Formik, Form } from "formik";
import { toast } from "sonner";
import { Lock, BadgeCheck, MailWarning } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { Switch } from "@/components/atoms/Field";
import { FInput, applyServerErrors } from "@/components/molecules/FormikFields";
import { Panel } from "@/components/organisms/dashboard/PageHeader";
import { changePasswordFormSchema } from "@/formik/schema/auth";
import { api, errorMessage } from "@/interceptor/api";

export function SettingsForms({ preferences, emailVerified, email }: { preferences: { emailNotifications: boolean; marketingEmails: boolean }; emailVerified: boolean; email: string }) {
  const [prefs, setPrefs] = useState(preferences);
  const [sending, setSending] = useState(false);

  async function savePrefs(next: typeof prefs) {
    const prev = prefs;
    setPrefs(next);
    try {
      await api.patch("/account/preferences", next);
      toast.success("Preferences saved");
    } catch (err) {
      setPrefs(prev);
      toast.error(errorMessage(err));
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <Panel title="Change password">
        <Formik
          initialValues={{ currentPassword: "", newPassword: "", confirmPassword: "" }}
          validationSchema={changePasswordFormSchema}
          onSubmit={async (values, { setErrors, resetForm }) => {
            try {
              await api.post("/auth/change-password", { currentPassword: values.currentPassword, newPassword: values.newPassword });
              toast.success("Password changed. Other devices have been signed out.");
              resetForm();
            } catch (err) {
              applyServerErrors(err, setErrors);
              toast.error(errorMessage(err));
            }
          }}
        >
          {({ isSubmitting }) => (
            <Form className="space-y-4" noValidate>
              <FInput name="currentPassword" type="password" label="Current password" autoComplete="current-password" icon={<Lock />} />
              <FInput name="newPassword" type="password" label="New password" autoComplete="new-password" icon={<Lock />} hint="8+ characters with a letter and a number" />
              <FInput name="confirmPassword" type="password" label="Confirm new password" autoComplete="new-password" icon={<Lock />} />
              <Button type="submit" loading={isSubmitting}>Update password</Button>
            </Form>
          )}
        </Formik>
      </Panel>
      <div className="space-y-6">
        <Panel title="Email">
          {emailVerified ? (
            <p className="flex items-center gap-2 text-sm text-success"><BadgeCheck className="size-5" /> {email} is verified.</p>
          ) : (
            <div className="space-y-4">
              <p className="flex items-center gap-2 text-sm text-warning"><MailWarning className="size-5" /> {email} isn&apos;t verified yet.</p>
              <Button variant="secondary" loading={sending} onClick={async () => {
                setSending(true);
                try {
                  const r = await api.post<{ delivered?: boolean }>("/auth/resend-verification");
                  toast.success(r.delivered === false ? "SMTP isn't configured: the link was printed to the server console." : "Verification email sent.");
                } catch (err) { toast.error(errorMessage(err)); } finally { setSending(false); }
              }}>Resend verification email</Button>
            </div>
          )}
        </Panel>
        <Panel title="Notifications">
          <div className="space-y-4">
            <Switch label="Email updates" description="Order, booking and account emails. Receipts and security emails are always sent." checked={prefs.emailNotifications} onChange={(v) => savePrefs({ ...prefs, emailNotifications: v })} />
            <Switch label="Marketing emails" description="Occasional news about new vendors and collections." checked={prefs.marketingEmails} onChange={(v) => savePrefs({ ...prefs, marketingEmails: v })} />
          </div>
        </Panel>
      </div>
    </div>
  );
}
