import { ResetPasswordForm } from "@/components/templates/Auth/PasswordForms";

export const metadata = { title: "Reset password" };

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token = "" } = await searchParams;
  return <ResetPasswordForm token={token} />;
}
