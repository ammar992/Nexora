import { Suspense } from "react";
import { Navbar } from "@/components/organisms/Navbar";
import { Footer } from "@/components/organisms/Footer";
import { CartDrawer } from "@/components/organisms/CartDrawer";
import { PageTransition } from "@/components/organisms/PageTransition";
import { getPublicSettings } from "@/server/services/settings";
import { getCategoriesWithCounts } from "@/server/services/catalog";

export default async function WebLayout({ children }: { children: React.ReactNode }) {
  const [settings, categories] = await Promise.all([getPublicSettings(), getCategoriesWithCounts()]);
  const nav = categories.map((c) => ({ slug: c.slug, name: c.name, icon: c.icon, type: c.type, count: c.count }));
  return (
    <>
      <Suspense fallback={<div className="h-[88px]" />}>
        <Navbar siteName={settings.siteName} logoUrl={settings.logoUrl} categories={nav} />
      </Suspense>
      <main id="main" className="min-h-[70vh]">
        <PageTransition>{children}</PageTransition>
      </main>
      <Footer settings={settings} categories={nav} />
      <CartDrawer />
    </>
  );
}
