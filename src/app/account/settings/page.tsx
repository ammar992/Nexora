import { requirePageUser } from "@/server/auth/session";
import { User } from "@/server/models/User";
import { PageHeader } from "@/components/organisms/dashboard/PageHeader";
import { SettingsForms } from "@/components/templates/Account/SettingsForms";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const session = await requirePageUser();
  const u = await User.findById(session.id).select("preferences emailVerified email").lean();
  return (
    <>
      <PageHeader title="Settings" description="Security and notification preferences." />
      <SettingsForms
        email={u?.email ?? session.email}
        emailVerified={!!u?.emailVerified}
        preferences={{ emailNotifications: u?.preferences?.emailNotifications ?? true, marketingEmails: u?.preferences?.marketingEmails ?? false }}
      />
    </>
  );
}
