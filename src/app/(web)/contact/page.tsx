import { Mail, Phone, MapPin } from "lucide-react";
import { ContactForm } from "@/components/templates/Static/ContactForm";
import { getPublicSettings } from "@/server/services/settings";

export const metadata = { title: "Contact" };

export default async function ContactPage() {
  const s = await getPublicSettings();
  return (
    <div className="container-x pt-28 md:pt-36">
      <div className="grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <p className="eyebrow">Contact</p>
          <h1 className="display-lg mt-4 text-ink">Talk to a person.</h1>
          <p className="mt-5 max-w-md text-muted">Questions about an order, selling on {s.siteName}, or anything else. For a specific order, include its reference so we can help faster.</p>
          <ul className="mt-10 space-y-4">
            {s.contact?.email && <li className="flex items-center gap-3 text-ink"><Mail className="size-5 text-accent" /><a href={`mailto:${s.contact.email}`} className="hover:underline">{s.contact.email}</a></li>}
            {s.contact?.phone && <li className="flex items-center gap-3 text-ink"><Phone className="size-5 text-accent" />{s.contact.phone}</li>}
            {s.contact?.address && <li className="flex items-center gap-3 text-ink"><MapPin className="size-5 text-accent" />{s.contact.address}</li>}
          </ul>
        </div>
        <div className="rounded-[32px] border border-line bg-surface p-6 md:p-10 lg:col-span-7">
          <ContactForm />
        </div>
      </div>
    </div>
  );
}
