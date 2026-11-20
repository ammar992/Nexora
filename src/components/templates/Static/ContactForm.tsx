"use client";

import { useState } from "react";
import { Formik, Form } from "formik";
import * as yup from "yup";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { FInput, FTextArea, applyServerErrors } from "@/components/molecules/FormikFields";
import { api, errorMessage } from "@/interceptor/api";

const schema = yup.object({
  name: yup.string().trim().min(2, "Your name is required").required("Your name is required"),
  email: yup.string().trim().email("Enter a valid email").required("Email is required"),
  subject: yup.string().trim().max(120),
  message: yup.string().trim().min(10, "Write at least 10 characters").required("Write a message"),
});

export function ContactForm() {
  const [sent, setSent] = useState(false);
  if (sent) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center py-12 text-center">
        <span className="grid size-14 place-items-center rounded-full bg-success text-white"><Check className="size-7" /></span>
        <p className="mt-5 font-display text-3xl text-ink">Message sent</p>
        <p className="mt-2 text-muted">We usually reply within one business day.</p>
      </motion.div>
    );
  }
  return (
    <Formik
      initialValues={{ name: "", email: "", subject: "", message: "" }}
      validationSchema={schema}
      onSubmit={async (values, { setErrors, setStatus }) => {
        try {
          await api.post("/contact", values);
          setSent(true);
        } catch (err) {
          applyServerErrors(err, setErrors);
          setStatus(errorMessage(err));
        }
      }}
    >
      {({ isSubmitting, status }) => (
        <Form className="grid gap-4 sm:grid-cols-2" noValidate>
          {status && <p role="alert" className="rounded-2xl bg-danger-soft px-4 py-3 text-sm text-danger sm:col-span-2">{status}</p>}
          <FInput name="name" label="Your name" autoComplete="name" />
          <FInput name="email" type="email" label="Email" autoComplete="email" />
          <FInput name="subject" label="Subject (optional)" containerClassName="sm:col-span-2" />
          <FTextArea name="message" label="How can we help?" rows={6} containerClassName="sm:col-span-2" />
          <Button type="submit" size="lg" className="sm:col-span-2" loading={isSubmitting}>Send message</Button>
        </Form>
      )}
    </Formik>
  );
}
