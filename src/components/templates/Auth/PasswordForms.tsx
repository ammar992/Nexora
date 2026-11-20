"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Formik, Form } from "formik";
import { motion } from "framer-motion";
import { Mail, Lock, MailCheck, CheckCircle2, XCircle, ArrowLeft } from "lucide-react";
import { Button, ButtonLink } from "@/components/atoms/Button";
import { Spinner } from "@/components/atoms/Spinner";
import { FInput, applyServerErrors } from "@/components/molecules/FormikFields";
import { forgotPasswordSchema, resetPasswordFormSchema } from "@/formik/schema/auth";
import { api, errorMessage } from "@/interceptor/api";

function Result({ icon, title, body, children }: { icon: React.ReactNode; title: string; body: string; children?: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.1 }} className="mx-auto mb-6 grid size-16 place-items-center rounded-full bg-accent-soft text-accent [&_svg]:size-8">
        {icon}
      </motion.div>
      <h1 className="font-display text-4xl text-ink">{title}</h1>
      <p className="mx-auto mt-3 max-w-sm text-muted">{body}</p>
      <div className="mt-8">{children}</div>
    </motion.div>
  );
}

export function ForgotPasswordForm() {
  const [sentTo, setSentTo] = useState("");
  if (sentTo) {
    return (
      <Result icon={<MailCheck />} title="Check your inbox" body={`If an account exists for ${sentTo}, we've sent a link to reset your password. It expires in 30 minutes.`}>
        <ButtonLink href="/login" variant="secondary">
          Back to sign in
        </ButtonLink>
      </Result>
    );
  }
  return (
    <>
      <Link href="/login" className="mb-8 inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink">
        <ArrowLeft className="size-4" /> Back to sign in
      </Link>
      <h1 className="font-display text-[2.6rem] leading-tight text-ink">Forgot your password?</h1>
      <p className="mt-2 text-muted">Enter your email and we&apos;ll send you a reset link.</p>
      <Formik
        initialValues={{ email: "" }}
        validationSchema={forgotPasswordSchema}
        onSubmit={async (values, { setErrors, setStatus }) => {
          try {
            await api.post("/auth/forgot-password", values);
            setSentTo(values.email);
          } catch (err) {
            applyServerErrors(err, setErrors);
            setStatus(errorMessage(err));
          }
        }}
      >
        {({ isSubmitting, status }) => (
          <Form className="mt-8 space-y-4" noValidate>
            {status && <p role="alert" className="rounded-2xl bg-danger-soft px-4 py-3 text-sm font-medium text-danger">{status}</p>}
            <FInput name="email" type="email" label="Email" autoComplete="email" icon={<Mail />} />
            <Button type="submit" size="lg" loading={isSubmitting} className="w-full">
              Send reset link
            </Button>
          </Form>
        )}
      </Formik>
    </>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [done, setDone] = useState(false);
  if (!token) {
    return (
      <Result icon={<XCircle />} title="Link not valid" body="This reset link is missing its token. Request a new one below.">
        <ButtonLink href="/forgot-password">Request a new link</ButtonLink>
      </Result>
    );
  }
  if (done) {
    return (
      <Result icon={<CheckCircle2 />} title="Password updated" body="You can now sign in with your new password. Other devices have been signed out.">
        <Button onClick={() => router.push("/login")}>Sign in</Button>
      </Result>
    );
  }
  return (
    <>
      <h1 className="font-display text-[2.6rem] leading-tight text-ink">Choose a new password</h1>
      <p className="mt-2 text-muted">Use at least 8 characters, including a letter and a number.</p>
      <Formik
        initialValues={{ token, password: "", confirmPassword: "" }}
        validationSchema={resetPasswordFormSchema}
        onSubmit={async (values, { setErrors, setStatus }) => {
          try {
            await api.post("/auth/reset-password", { token: values.token, password: values.password });
            setDone(true);
          } catch (err) {
            applyServerErrors(err, setErrors);
            setStatus(errorMessage(err));
          }
        }}
      >
        {({ isSubmitting, status }) => (
          <Form className="mt-8 space-y-4" noValidate>
            {status && (
              <p role="alert" className="rounded-2xl bg-danger-soft px-4 py-3 text-sm font-medium text-danger">
                {status}{" "}
                <Link href="/forgot-password" className="underline">
                  Request a new link
                </Link>
              </p>
            )}
            <FInput name="password" type="password" label="New password" autoComplete="new-password" icon={<Lock />} />
            <FInput name="confirmPassword" type="password" label="Confirm new password" autoComplete="new-password" icon={<Lock />} />
            <Button type="submit" size="lg" loading={isSubmitting} className="w-full">
              Update password
            </Button>
          </Form>
        )}
      </Formik>
    </>
  );
}

export function VerifyEmail({ token }: { token: string }) {
  const [state, setState] = useState<"loading" | "ok" | "error">(token ? "loading" : "error");
  const [message, setMessage] = useState("This verification link is missing its token.");
  const ran = useRef(false);
  useEffect(() => {
    if (!token || ran.current) return;
    ran.current = true;
    api
      .post("/auth/verify-email", { token })
      .then(() => setState("ok"))
      .catch((err) => {
        setMessage(errorMessage(err));
        setState("error");
      });
  }, [token]);

  if (state === "loading") {
    return (
      <div className="flex flex-col items-center gap-4 py-10 text-muted">
        <Spinner className="size-8 text-accent" />
        Verifying your email…
      </div>
    );
  }
  if (state === "ok") {
    return (
      <Result icon={<CheckCircle2 />} title="Email verified" body="Thanks for confirming. You can now check out and book on the marketplace.">
        <ButtonLink href="/explore">Start exploring</ButtonLink>
      </Result>
    );
  }
  return (
    <Result icon={<XCircle />} title="We couldn't verify that" body={message}>
      <ButtonLink href="/account/settings" variant="secondary">
        Resend from your account
      </ButtonLink>
    </Result>
  );
}
