import { Prose } from "@/components/templates/Static/Prose";
import { getSettings } from "@/server/services/settings";

export const metadata = { title: "About" };

export default async function AboutPage() {
  const s = await getSettings();
  return (
    <Prose
      eyebrow="About"
      title={`Why ${s.siteName} exists`}
      intro={s.tagline}
      sections={[
        { h: "Small makers, real services", p: ["Most marketplaces are built for volume. We built this one for the people who make a few things very well: potters, leatherworkers, photographers, cooks, stylists.", "One storefront lets them sell what they make and book the time they offer, without stitching together five different tools."] },
        { h: "Every vendor is reviewed", p: ["Before a storefront opens, someone on our team reads the application and checks the work. Listings are reviewed before they go live, and again when their content changes."] },
        { h: "Reviews you can trust", p: ["Only customers who received an order or attended a booking can leave a review, and every review shows that it's verified. Vendors can reply, but they can't remove them."] },
        { h: `How ${s.siteName} makes money`, p: [`We take a ${s.commissionRate}% commission on completed sales. There are no listing fees or monthly subscriptions, so we only earn when our vendors do.`] },
      ]}
    />
  );
}
