"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Formik, Form } from "formik";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Mail, Lock, User, ShoppingBag, Store } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { FInput, FCheckbox, applyServerErrors } from "@/components/molecules/FormikFields";
import { registerFormSchema } from "@/formik/schema/auth";
import { api, errorMessage } from "@/interceptor/api";
import { cn } from "@/resources/utils/cn";

function strength(pw: string) {
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (/[a-z]/i.test(pw) && /\d/.test(pw)) s++;
  if (/[^a-z0-9]/i.test(pw)) s++;
  return s;
}

export function RegisterForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [formError, setFormError] = useState("");
  return (
    <>
      <h1 className="font-display text-[2.6rem] leading-tight text-ink">Create your account</h1>
      <p className="mt-2 text-muted">
        Already have one?{" "}
        <Link href="/login" className="font-semibold text-accent hover:underline">
          Sign in
        </Link>
      </p>
      <Formik
        initialValues={{ name: "", email: "", password: "", confirmPassword: "", terms: false, accountType: params.get("as") === "vendor" ? "vendor" : "customer" }}
        validationSchema={registerFormSchema}
        onSubmit={async (values, { setErrors }) => {
          setFormError("");
          try {
            const res = await api.post<{ next: string }>("/auth/register", values);
            toast.success("Account created. Check your inbox to verify your email.");
            router.push(res.next);
            router.refresh();
          } catch (err) {
            applyServerErrors(err, setErrors);
            setFormError(errorMessage(err));
          }
        }}
      >
        {({ isSubmitting, values, setFieldValue }) => {
          const s = strength(values.password);
          return (
            <Form className="mt-8 space-y-4" noValidate>
              <div role="radiogroup" aria-label="Account type" className="grid grid-cols-2 gap-3">
                {[
                  { v: "customer", label: "I want to buy", icon: ShoppingBag },
                  { v: "vendor", label: "I want to sell", icon: Store },
                ].map((o) => {
                  const active = values.accountType === o.v;
                  return (
                    <button key={o.v} type="button" role="radio" aria-checked={active} onClick={() => setFieldValue("accountType", o.v)} className={cn("relative flex items-center gap-2.5 rounded-2xl border p-4 text-left text-sm font-semibold transition", active ? "border-accent text-ink" : "border-line text-muted hover:border-line-strong")}>
                      {active && <motion.span layoutId="acct" className="absolute inset-0 -z-10 rounded-2xl bg-accent-soft" />}
                      <o.icon className={cn("size-[18px]", active && "text-accent")} /> {o.label}
                    </button>
                  );
                })}
              </div>
              {formError && <p role="alert" className="rounded-2xl bg-danger-soft px-4 py-3 text-sm font-medium text-danger">{formError}</p>}
              <FInput name="name" label="Full name" autoComplete="name" icon={<User />} />
              <FInput name="email" type="email" label="Email" autoComplete="email" icon={<Mail />} />
              <div>
                <FInput name="password" type="password" label="Password" autoComplete="new-password" icon={<Lock />} hint="8+ characters with a letter and a number" />
                {values.password && (
                  <div className="mt-2 flex gap-1.5" aria-label={`Password strength ${s} of 4`}>
                    {[0, 1, 2, 3].map((i) => (
                      <motion.span key={i} className="h-1 flex-1 rounded-full bg-surface-3" animate={{ backgroundColor: i < s ? (s <= 1 ? "var(--danger)" : s === 2 ? "var(--warning)" : "var(--success)") : "var(--surface-3)" }} />
                    ))}
                  </div>
                )}
              </div>
              <FInput name="confirmPassword" type="password" label="Confirm password" autoComplete="new-password" icon={<Lock />} />
              <FCheckbox
                name="terms"
                label={
                  <>
                    I agree to the <Link href="/terms" className="text-accent underline">terms</Link> and <Link href="/privacy" className="text-accent underline">privacy policy</Link>
                  </>
                }
              />
              <Button type="submit" size="lg" loading={isSubmitting} className="w-full">
                {values.accountType === "vendor" ? "Continue to vendor application" : "Create account"}
              </Button>
            </Form>
          );
        }}
      </Formik>
    </>
  );
}
