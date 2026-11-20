import { DashboardShell } from "@/components/organisms/dashboard/DashboardShell";
import { VerifyBanner } from "@/components/organisms/dashboard/VerifyBanner";
import { requirePageUser } from "@/server/auth/session";
import { getSettings } from "@/server/services/settings";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePageUser(undefined, "/account");
  const settings = await getSettings();
  return (
    <DashboardShell area="account" siteName={settings.siteName} banner={!user.emailVerified ? <VerifyBanner email={user.email} /> : null}>
      {children}
    </DashboardShell>
  );
}
