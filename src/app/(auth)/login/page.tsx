import { Suspense } from "react";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/templates/Auth/LoginForm";
import { getCurrentUser } from "@/server/auth/session";

export const metadata = { title: "Sign in" };

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect(user.role === "admin" ? "/admin" : user.role === "vendor" ? "/vendor" : "/account");
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
