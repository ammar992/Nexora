"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Formik, Form } from "formik";
import { MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/atoms/Button";
import { Modal } from "@/components/molecules/Modal";
import { FTextArea, applyServerErrors } from "@/components/molecules/FormikFields";
import { inquirySchema } from "@/formik/schema/account";
import { api, errorMessage } from "@/interceptor/api";
import { useSession } from "@/context/SessionContext";

export function AskVendor({ listingId, slug, vendorName }: { listingId: string; slug: string; vendorName: string }) {
  const { user } = useSession();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="secondary" onClick={() => (user ? setOpen(true) : router.push(`/login?next=/listing/${slug}`))}>
        <MessageCircle className="size-4" /> Ask the vendor
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title={`Message ${vendorName}`} description="They'll get your question by email and can reply to you directly.">
        <Formik
          initialValues={{ message: "" }}
          validationSchema={inquirySchema}
          onSubmit={async (values, { setErrors, resetForm }) => {
            try {
              await api.post(`/listings/${listingId}/inquiry`, values);
              toast.success("Message sent. The vendor will reply by email.");
              resetForm();
              setOpen(false);
            } catch (err) {
              applyServerErrors(err, setErrors);
              toast.error(errorMessage(err));
            }
          }}
        >
          {({ isSubmitting }) => (
            <Form className="space-y-4" noValidate>
              <FTextArea name="message" label="Your question" rows={5} maxLength={1500} />
              <Button type="submit" className="w-full" size="lg" loading={isSubmitting}>
                Send message
              </Button>
            </Form>
          )}
        </Formik>
      </Modal>
    </>
  );
}
