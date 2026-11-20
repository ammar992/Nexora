"use client";

import { useRouter } from "next/navigation";
import { Formik, Form } from "formik";
import { toast } from "sonner";
import { Button } from "@/components/atoms/Button";
import { FInput, FTextArea, applyServerErrors } from "@/components/molecules/FormikFields";
import { SingleImageUpload } from "@/components/molecules/ImageUploader";
import { Panel } from "@/components/organisms/dashboard/PageHeader";
import { profileSchema } from "@/formik/schema/account";
import { api, errorMessage } from "@/interceptor/api";

type Values = { name: string; phone: string; bio: string; avatar: string; address: { line1: string; line2: string; city: string; state: string; postalCode: string; country: string } };

export function ProfileForm({ initial, email }: { initial: Values; email: string }) {
  const router = useRouter();
  return (
    <Formik
      initialValues={initial}
      validationSchema={profileSchema}
      onSubmit={async (values, { setErrors, resetForm }) => {
        try {
          await api.patch("/account/profile", values);
          toast.success("Profile saved");
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
          <Panel title="Personal details" className="xl:col-span-2">
            <div className="mb-6">
              <SingleImageUpload value={values.avatar} onChange={(url) => setFieldValue("avatar", url)} folder="avatars" label="Profile photo" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FInput name="name" label="Full name" autoComplete="name" />
              <FInput name="phone" label="Phone" autoComplete="tel" />
              <div className="sm:col-span-2">
                <p className="mb-1 text-[13px] text-muted">Email: <span className="font-semibold text-ink">{email}</span></p>
              </div>
              <FTextArea name="bio" label="About you (optional)" rows={3} maxLength={500} containerClassName="sm:col-span-2" />
            </div>
          </Panel>
          <Panel title="Default shipping address">
            <div className="grid gap-4">
              <FInput name="address.line1" label="Street address" autoComplete="address-line1" />
              <FInput name="address.line2" label="Apartment, suite" autoComplete="address-line2" />
              <div className="grid grid-cols-2 gap-4">
                <FInput name="address.city" label="City" />
                <FInput name="address.state" label="State" />
                <FInput name="address.postalCode" label="Postal code" />
                <FInput name="address.country" label="Country" />
              </div>
            </div>
          </Panel>
          <div className="flex justify-end xl:col-span-3">
            <Button type="submit" size="lg" loading={isSubmitting} disabled={!dirty}>Save changes</Button>
          </div>
        </Form>
      )}
    </Formik>
  );
}
