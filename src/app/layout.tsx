import type { Metadata, Viewport } from "next";
import { Fraunces, Manrope } from "next/font/google";
import { Toaster } from "sonner";
import { MotionConfig } from "framer-motion";
import "./styles/globals.css";
import { StoreProvider } from "@/store/StoreProvider";
import { ThemeProvider, themeInitScript } from "@/context/ThemeContext";
import { SessionProvider } from "@/context/SessionContext";
import { getCurrentUser } from "@/server/auth/session";
import { getSettings } from "@/server/services/settings";
import { appUrl } from "@/server/env";

const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", display: "swap", axes: ["SOFT", "opsz"], style: ["normal", "italic"] });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope", display: "swap" });

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings().catch(() => null);
  const name = s?.siteName ?? "Nexora";
  return {
    metadataBase: new URL(appUrl()),
    title: { default: `${name} — goods and services from independent makers`, template: `%s · ${name}` },
    description: s?.tagline ?? "Shop small-batch goods and book trusted local services.",
    icons: s?.faviconUrl ? { icon: s.faviconUrl } : { icon: "/favicon.svg" },
    openGraph: { siteName: name, type: "website" },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f2ec" },
    { media: "(prefers-color-scheme: dark)", color: "#12100e" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Reading the session cookie makes every route dynamic (per-user header, cart, dashboards).
  const user = await getCurrentUser();
  return (
    <html lang="en" className={`${fraunces.variable} ${manrope.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-bg">
          Skip to content
        </a>
        <MotionConfig reducedMotion="user">
          <ThemeProvider>
            <StoreProvider>
              <SessionProvider user={user}>{children}</SessionProvider>
            </StoreProvider>
          </ThemeProvider>
        </MotionConfig>
        <Toaster position="bottom-center" toastOptions={{ className: "!rounded-2xl !border-line !bg-surface !text-ink !font-sans !shadow-lift" }} />
      </body>
    </html>
  );
}
