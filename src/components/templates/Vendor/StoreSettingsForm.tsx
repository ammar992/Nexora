"use client";

import { useRouter } from "next/navigation";
import { Formik, Form } from "formik";
import { toast } from "sonner";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { FInput, FTextArea, applyServerErrors } from "@/components/molecules/FormikFields";
import { SingleImageUpload } from "@/components/molecules/ImageUploader";
import { Panel } from "@/components/organisms/dashboard/PageHeader";
import { vendorProfileSchema } from "@/formik/schema/account";
import { api, errorMessage } from "@/interceptor/api";

export type StoreValues = {
  storeName: string; tagline: string; description: string; city: string; country: string; contactEmail: string; contactPhone: string; website: string;
  logo: string; coverImage: string; payoutAccountName: string; payoutBankName: string; payoutAccountLast4: string;
};

export function StoreSettingsForm({ initial, slug }: { initial: StoreValues; slug: string }) {
  const router = useRouter();
  return (
    <Formik
      initialValues={initial}
      validationSchema={vendorProfileSchema}
      onSubmit={async (values, { setErrors, resetForm }) => {
        try {
          await api.patch("/vendor/profile", values);
          toast.success("Store updated");
          resetForm({ values });
          router.refresh();
        } catch (err) {
          applyServerErrors(err, setErrors);
          toast.error(errorMessage(err));
        }
      }}
    >
      {({ values, setFieldValue, isSubmitting, dirty }) => (
        <Form className="grid gap-6 xl:grid-cols-3" noValidate>
          <div className="space-y-6 xl:col-span-2">
            <Panel title="Storefront" action={<a href={`/vendors/${slug}`} target="_blank" className="inline-flex items-center gap-1 text-sm font-semibold text-accent">View <ExternalLink className="size-3.5" /></a>}>
              <div className="space-y-5">
                <div>
                  <p className="mb-2 text-sm font-semibold text-ink">Cover image</p>
                  <SingleImageUpload value={values.coverImage} onChange={(u) => setFieldValue("coverImage", u)} folder="vendors" label="Cover image" shape="wide" />
                </div>
                <SingleImageUpload value={values.logo} onChange={(u) => setFieldValue("logo", u)} folder="vendors" label="Logo" />
                <div className="grid gap-4 sm:grid-cols-2">
                  <FInput name="storeName" label="Store name" containerClassName="sm:col-span-2" />
                  <FInput name="tagline" label="Tagline" maxLength={140} containerClassName="sm:col-span-2" />
                  <FTextArea name="description" label="About your store" rows={5} containerClassName="sm:col-span-2" />
                  <FInput name="city" label="City" />
                  <FInput name="country" label="Country" />
                </div>
              </div>
            </Panel>
          </div>
          <div className="space-y-6">
            <Panel title="Contact">
              <div className="space-y-4">
                <FInput name="contactEmail" type="email" label="Contact email" />
                <FInput name="contactPhone" label="Phone" />
                <FInput name="website" label="Website" placeholder="https://" />
              </div>
            </Panel>
            <Panel title="Payout details">
              <p className="mb-4 text-[13px] text-muted">Used by the marketplace to pay out card sales. Only the last four digits of your account number are stored.</p>
              <div className="space-y-4">
                <FInput name="payoutAccountName" label="Account holder" />
                <FInput name="payoutBankName" label="Bank" />
                <FInput name="payoutAccountLast4" label="Account number (last 4)" maxLength={4} inputMode="numeric" />
              </div>
            </Panel>
            <Button type="submit" size="lg" className="w-full" loading={isSubmitting} disabled={!dirty}>Save store settings</Button>
          </div>
        </Form>
      )}
    </Formik>
  );
}
