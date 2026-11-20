import { VerifyEmail } from "@/components/templates/Auth/PasswordForms";

export const metadata = { title: "Verify email" };

export default async function VerifyEmailPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token = "" } = await searchParams;
  return <VerifyEmail token={token} />;
}
