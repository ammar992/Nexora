import { Prose } from "@/components/templates/Static/Prose";
import { getSettings } from "@/server/services/settings";

export const metadata = { title: "Privacy policy" };

export default async function PrivacyPage() {
  const s = await getSettings();
  return (
    <Prose
      eyebrow="Legal"
      title="Privacy policy"
      intro="Template policy. Adapt it to your business and local law before launch."
      sections={[
        { h: "What we collect", p: ["Account details (name, email, password hash), profile information you add, shipping addresses, order and booking history, reviews, and messages you send to vendors."] },
        { h: "Payments", p: ["Card payments are handled by our payment provider. Card numbers are never sent to or stored on our servers."] },
        { h: "How we use it", p: ["To run your account, process orders and bookings, send transactional emails (verification, receipts, status updates), prevent fraud and abuse, and improve the service."] },
        { h: "Sharing", p: ["Vendors receive what they need to fulfil your order or booking: your name, contact details and shipping address. We don't sell personal data."] },
        { h: "Your choices", p: ["You can update your profile and notification preferences in account settings, and ask us to export or delete your data."] },
        { h: "Contact", p: [`Privacy questions: ${s.contact?.email || "see the contact page"}.`] },
      ]}
    />
  );
}
