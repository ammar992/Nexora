import { Suspense } from "react";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/templates/Auth/RegisterForm";
import { getCurrentUser } from "@/server/auth/session";

export const metadata = { title: "Create an account" };

export default async function RegisterPage() {
  if (await getCurrentUser()) redirect("/account");
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
