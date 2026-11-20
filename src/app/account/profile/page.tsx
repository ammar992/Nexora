import { requirePageUser } from "@/server/auth/session";
import { User } from "@/server/models/User";
import { PageHeader } from "@/components/organisms/dashboard/PageHeader";
import { ProfileForm } from "@/components/templates/Account/ProfileForm";

export const metadata = { title: "Profile" };

export default async function ProfilePage() {
  const session = await requirePageUser();
  const u = await User.findById(session.id).select("name phone bio avatar address email").lean();
  const a = u?.address;
  return (
    <>
      <PageHeader title="Profile" description="How you appear to vendors, and where your orders ship." />
      <ProfileForm
        email={u?.email ?? session.email}
        initial={{ name: u?.name ?? "", phone: u?.phone ?? "", bio: u?.bio ?? "", avatar: u?.avatar ?? "", address: { line1: a?.line1 ?? "", line2: a?.line2 ?? "", city: a?.city ?? "", state: a?.state ?? "", postalCode: a?.postalCode ?? "", country: a?.country ?? "" } }}
      />
    </>
  );
}
