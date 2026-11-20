"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Formik, Form } from "formik";
import { toast } from "sonner";
import { Mail, Lock } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { FInput, applyServerErrors } from "@/components/molecules/FormikFields";
import { loginSchema } from "@/formik/schema/auth";
import { api, errorMessage } from "@/interceptor/api";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

function safeNext(next: string | null) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : null;
}

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [formError, setFormError] = useState("");
  return (
    <>
      <h1 className="font-display text-[2.6rem] leading-tight text-ink">Welcome back</h1>
      <p className="mt-2 text-muted">
        New here?{" "}
        <Link href="/register" className="font-semibold text-accent hover:underline">
          Create an account
        </Link>
      </p>
      <Formik
        initialValues={{ email: "", password: "" }}
        validationSchema={loginSchema}
        onSubmit={async (values, { setErrors }) => {
          setFormError("");
          try {
            const res = await api.post<{ home: string }>("/auth/login", values);
            toast.success("Signed in");
            router.push(safeNext(params.get("next")) ?? res.home);
            router.refresh();
          } catch (err) {
            applyServerErrors(err, setErrors);
            setFormError(errorMessage(err));
          }
        }}
      >
        {({ isSubmitting }) => (
          <Form className="mt-9 space-y-4" noValidate>
            <AnimatePresence>
              {formError && (
                <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} role="alert" className="rounded-2xl bg-danger-soft px-4 py-3 text-sm font-medium text-danger">
                  {formError}
                </motion.p>
              )}
            </AnimatePresence>
            <FInput name="email" type="email" label="Email" autoComplete="email" icon={<Mail />} />
            <FInput name="password" type="password" label="Password" autoComplete="current-password" icon={<Lock />} />
            <div className="flex justify-end">
              <Link href="/forgot-password" className="text-sm font-semibold text-ink-soft hover:text-accent">
                Forgot password?
              </Link>
            </div>
            <Button type="submit" size="lg" loading={isSubmitting} className="w-full">
              Sign in
            </Button>
          </Form>
        )}
      </Formik>
    </>
  );
}
