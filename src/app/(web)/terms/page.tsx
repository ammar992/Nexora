import { Prose } from "@/components/templates/Static/Prose";
import { getSettings } from "@/server/services/settings";

export const metadata = { title: "Terms of use" };

export default async function TermsPage() {
  const s = await getSettings();
  return (
    <Prose
      eyebrow="Legal"
      title="Terms of use"
      intro="Template terms. Have them reviewed by a lawyer for your jurisdiction before launch."
      sections={[
        { h: "Using the marketplace", p: [`${s.siteName} connects customers with independent vendors. Vendors are responsible for their listings, products and services; ${s.siteName} provides the platform, payments integration and support.`] },
        { h: "Accounts", p: ["You must provide accurate information and keep your password secure. You're responsible for activity on your account. We may suspend accounts that break these terms."] },
        { h: "Orders and bookings", p: ["Prices are set by vendors and confirmed at checkout. A booking is confirmed once paid online, or once the vendor accepts it when paying at the appointment. Cancellations and refunds follow the status rules shown in your account."] },
        { h: "Vendors", p: [`Vendors agree to the platform commission (currently ${s.commissionRate}%) on completed sales, to describe items honestly, and to fulfil orders and bookings they accept.`] },
        { h: "Reviews", p: ["Reviews must reflect a genuine experience. We may hide reviews that are abusive, off-topic or contain personal data."] },
        { h: "Contact", p: [`Questions about these terms: ${s.contact?.email || "see the contact page"}.`] },
      ]}
    />
  );
}
