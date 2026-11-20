import Link from "next/link";
import { Mail, Phone, MapPin } from "lucide-react";
import { XIcon, FacebookIcon, LinkedinIcon, YoutubeIcon, InstagramIcon } from "@/components/atoms/SocialIcons";
import { Logo } from "@/components/atoms/Logo";
import type { PublicSettings } from "@/server/services/settings";

export function Footer({ settings, categories }: { settings: PublicSettings; categories: { slug: string; name: string }[] }) {
  const socials = [
    { href: settings.social?.instagram, label: "Instagram", Icon: InstagramIcon },
    { href: settings.social?.x, label: "X", Icon: XIcon },
    { href: settings.social?.facebook, label: "Facebook", Icon: FacebookIcon },
    { href: settings.social?.linkedin, label: "LinkedIn", Icon: LinkedinIcon },
    { href: settings.social?.youtube, label: "YouTube", Icon: YoutubeIcon },
  ].filter((s) => s.href);

  const cols = [
    { title: "Marketplace", links: [{ href: "/explore", label: "Explore everything" }, { href: "/explore?type=product", label: "Shop products" }, { href: "/explore?type=service", label: "Book services" }, { href: "/vendors", label: "Meet the vendors" }] },
    { title: "Categories", links: categories.slice(0, 5).map((c) => ({ href: `/explore?category=${c.slug}`, label: c.name })) },
    { title: "Company", links: [{ href: "/about", label: "About" }, { href: "/become-vendor", label: "Sell with us" }, { href: "/contact", label: "Contact" }, { href: "/terms", label: "Terms" }, { href: "/privacy", label: "Privacy" }] },
  ];

  return (
    <footer className="relative mt-24 overflow-hidden bg-ink text-bg">
      <div className="container-x relative pt-20 pb-10">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <div className="[&_span]:!text-bg">
              <Logo name={settings.siteName} logoUrl={settings.logoUrl} />
            </div>
            <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-bg/65">{settings.tagline}</p>
            <ul className="mt-6 space-y-2 text-sm text-bg/70">
              {settings.contact?.email && (
                <li className="flex items-center gap-2">
                  <Mail className="size-4" /> <a href={`mailto:${settings.contact.email}`} className="hover:text-bg">{settings.contact.email}</a>
                </li>
              )}
              {settings.contact?.phone && (
                <li className="flex items-center gap-2">
                  <Phone className="size-4" /> {settings.contact.phone}
                </li>
              )}
              {settings.contact?.address && (
                <li className="flex items-center gap-2">
                  <MapPin className="size-4" /> {settings.contact.address}
                </li>
              )}
            </ul>
          </div>
          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 lg:col-span-8">
            {cols.map((c) => (
              <div key={c.title}>
                <p className="eyebrow !text-bg/45">{c.title}</p>
                <ul className="mt-5 space-y-3">
                  {c.links.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} className="text-[15px] text-bg/80 transition hover:text-accent">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <p aria-hidden className="pointer-events-none mt-16 font-display text-[clamp(4rem,17vw,15rem)] leading-[0.8] tracking-[-0.05em] text-bg/[0.06] select-none">
          {settings.siteName}
        </p>
        <div className="mt-8 flex flex-col items-start justify-between gap-6 border-t border-bg/10 pt-8 text-[13px] text-bg/55 sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} {settings.siteName}. All rights reserved.</p>
          {socials.length > 0 && (
            <div className="flex gap-2">
              {socials.map(({ href, label, Icon }) => (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className="grid size-10 place-items-center rounded-full border border-bg/15 text-bg/80 transition hover:border-accent hover:bg-accent hover:text-accent-ink">
                  <Icon className="size-4" />
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}
