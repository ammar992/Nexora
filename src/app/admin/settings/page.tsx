import { getSettings } from "@/server/services/settings";
import { isEmailConfigured } from "@/server/email/mailer";
import { isCloudinaryConfigured } from "@/server/cloudinary";
import { PageHeader } from "@/components/organisms/dashboard/PageHeader";
import { SettingsForm } from "@/components/templates/Admin/SettingsForm";

export const metadata = { title: "Platform settings" };

export default async function AdminSettings() {
  const s = await getSettings();
  const h = s.homepage;
  return (
    <>
      <PageHeader title="Platform settings" description="Branding, homepage content, commission and contact details." />
      <SettingsForm
        env={{ smtp: isEmailConfigured(), stripe: Boolean(process.env.STRIPE_SECRET_KEY), cloudinary: isCloudinaryConfigured(), smtpHost: process.env.SMTP_HOST ?? "" }}
        initial={{
          siteName: s.siteName, tagline: s.tagline ?? "", logoUrl: s.logoUrl ?? "", faviconUrl: s.faviconUrl ?? "", currency: s.currency ?? "USD", commissionRate: s.commissionRate ?? 10,
          autoApproveListings: !!s.autoApproveListings, autoApproveVendors: !!s.autoApproveVendors,
          homepage: { heroEyebrow: h?.heroEyebrow ?? "", heroTitle: h?.heroTitle ?? "", heroSubtitle: h?.heroSubtitle ?? "", promoTitle: h?.promoTitle ?? "", promoText: h?.promoText ?? "", promoCta: h?.promoCta ?? "" },
          contact: { email: s.contact?.email ?? "", phone: s.contact?.phone ?? "", address: s.contact?.address ?? "" },
          social: { instagram: s.social?.instagram ?? "", x: s.social?.x ?? "", facebook: s.social?.facebook ?? "", linkedin: s.social?.linkedin ?? "", youtube: s.social?.youtube ?? "" },
          email: { fromName: s.email?.fromName ?? "", replyTo: s.email?.replyTo ?? "" },
        }}
      />
    </>
  );
}
