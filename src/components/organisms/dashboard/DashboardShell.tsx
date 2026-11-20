"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  LayoutDashboard, User, Heart, Package, CalendarDays, CreditCard, Star, Settings, Bell, Store, Boxes, Users, Wallet, ShieldCheck, LayoutGrid, Receipt, SlidersHorizontal, MessageSquareText, Menu, X, LogOut, ArrowUpRight, Moon, Sun,
} from "lucide-react";
import { Logo } from "@/components/atoms/Logo";
import { Avatar } from "@/components/atoms/Avatar";
import { NotificationBell } from "@/components/organisms/NotificationBell";
import { useSession } from "@/context/SessionContext";
import { useTheme } from "@/context/ThemeContext";
import { cn } from "@/resources/utils/cn";

type NavItem = { href: string; label: string; icon: React.ComponentType<{ className?: string }>; badge?: number };
type Area = "account" | "vendor" | "admin";

const NAV: Record<Area, { title: string; groups: { label?: string; items: NavItem[] }[] }> = {
  account: {
    title: "My account",
    groups: [
      { items: [{ href: "/account", label: "Overview", icon: LayoutDashboard }, { href: "/account/orders", label: "Orders", icon: Package }, { href: "/account/bookings", label: "Bookings", icon: CalendarDays }, { href: "/account/saved", label: "Saved", icon: Heart }] },
      { label: "Activity", items: [{ href: "/account/payments", label: "Payments", icon: CreditCard }, { href: "/account/reviews", label: "Reviews", icon: Star }, { href: "/account/notifications", label: "Notifications", icon: Bell }] },
      { label: "Account", items: [{ href: "/account/profile", label: "Profile", icon: User }, { href: "/account/settings", label: "Settings", icon: Settings }] },
    ],
  },
  vendor: {
    title: "Vendor studio",
    groups: [
      { items: [{ href: "/vendor", label: "Overview", icon: LayoutDashboard }, { href: "/vendor/listings", label: "Listings", icon: Boxes }, { href: "/vendor/orders", label: "Orders", icon: Package }, { href: "/vendor/bookings", label: "Bookings", icon: CalendarDays }] },
      { label: "Business", items: [{ href: "/vendor/customers", label: "Customers", icon: Users }, { href: "/vendor/reviews", label: "Reviews", icon: Star }, { href: "/vendor/earnings", label: "Earnings", icon: Wallet }] },
      { label: "Store", items: [{ href: "/vendor/settings", label: "Store settings", icon: Store }] },
    ],
  },
  admin: {
    title: "Admin console",
    groups: [
      { items: [{ href: "/admin", label: "Overview", icon: LayoutDashboard }] },
      { label: "People", items: [{ href: "/admin/users", label: "Users", icon: Users }, { href: "/admin/vendors", label: "Vendors", icon: Store }] },
      { label: "Catalog", items: [{ href: "/admin/listings", label: "Listings", icon: Boxes }, { href: "/admin/categories", label: "Categories", icon: LayoutGrid }, { href: "/admin/reviews", label: "Reviews", icon: MessageSquareText }] },
      { label: "Commerce", items: [{ href: "/admin/orders", label: "Orders", icon: Package }, { href: "/admin/bookings", label: "Bookings", icon: CalendarDays }, { href: "/admin/finance", label: "Finance", icon: Receipt }] },
      { label: "Platform", items: [{ href: "/admin/settings", label: "Settings", icon: SlidersHorizontal }] },
    ],
  },
};

function isActive(pathname: string, href: string, root: string) {
  return href === root ? pathname === root : pathname === href || pathname.startsWith(`${href}/`);
}

function SideNav({ area, badges, onNavigate }: { area: Area; badges?: Record<string, number>; onNavigate?: () => void }) {
  const pathname = usePathname();
  const root = `/${area}`;
  return (
    <nav aria-label={NAV[area].title} className="space-y-4">
      {NAV[area].groups.map((g, gi) => (
        <div key={gi}>
          {g.label && <p className="eyebrow mb-1.5 px-3 !text-[10px]">{g.label}</p>}
          <ul className="space-y-0.5">
            {g.items.map((it) => {
              const active = isActive(pathname, it.href, root);
              const badge = badges?.[it.href];
              return (
                <li key={it.href}>
                  <Link href={it.href} onClick={onNavigate} aria-current={active ? "page" : undefined} className={cn("relative flex items-center gap-3 rounded-2xl px-3 py-2 text-sm font-semibold transition-colors", active ? "text-ink" : "text-muted hover:bg-surface-2 hover:text-ink")}>
                    {active && <motion.span layoutId={`side-${area}`} className="absolute inset-0 -z-10 rounded-2xl border border-line bg-surface shadow-soft" transition={{ type: "spring", stiffness: 450, damping: 36 }} />}
                    <it.icon className={cn("size-[18px] shrink-0", active && "text-accent")} />
                    <span className="flex-1">{it.label}</span>
                    {badge ? <span className="rounded-full bg-accent px-1.5 text-[11px] leading-5 font-bold text-accent-ink">{badge}</span> : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export function DashboardShell({ area, siteName, badges, banner, children }: { area: Area; siteName: string; badges?: Record<string, number>; banner?: React.ReactNode; children: React.ReactNode }) {
  const { user, logout } = useSession();
  const { theme, toggle } = useTheme();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [seenPath, setSeenPath] = useState(pathname);
  if (pathname !== seenPath) {
    setSeenPath(pathname);
    setOpen(false);
  }

  const switchers = [
    user?.role === "admin" && area !== "admin" && { href: "/admin", label: "Admin console" },
    user?.vendorStatus === "approved" && area !== "vendor" && { href: "/vendor", label: "Vendor studio" },
    area !== "account" && { href: "/account", label: "My account" },
  ].filter(Boolean) as { href: string; label: string }[];

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="px-3 pb-5">
        <Logo name={siteName} />
        <p className="mt-1 pl-[42px] text-[12px] font-semibold text-muted">{NAV[area].title}</p>
      </div>
      <div className="scrollbar-none flex-1 overflow-y-auto px-1">
        <SideNav area={area} badges={badges} onNavigate={() => setOpen(false)} />
      </div>
      <div className="mt-4 space-y-0.5 border-t border-line px-1 pt-3">
        {switchers.map((s) => (
          <Link key={s.href} href={s.href} className="flex items-center justify-between rounded-2xl px-3 py-2 text-sm font-semibold text-muted hover:bg-surface-2 hover:text-ink">
            {s.label} <ArrowUpRight className="size-4" />
          </Link>
        ))}
        <Link href="/" className="flex items-center justify-between rounded-2xl px-3 py-2 text-sm font-semibold text-muted hover:bg-surface-2 hover:text-ink">
          Back to marketplace <ArrowUpRight className="size-4" />
        </Link>
        {user && (
          <div className="mt-3 flex items-center gap-3 rounded-2xl bg-surface-2 p-3">
            <Avatar name={user.name} src={user.avatar} size={36} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink">{user.name}</p>
              <p className="truncate text-[12px] text-muted">{user.email}</p>
            </div>
            <button type="button" onClick={logout} className="grid size-8 place-items-center rounded-full text-muted hover:bg-surface hover:text-danger" aria-label="Sign out">
              <LogOut className="size-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh bg-bg lg:grid lg:grid-cols-[272px_1fr]">
      <aside className="sticky top-0 hidden h-dvh border-r border-line bg-bg px-3 py-6 lg:block">{sidebar}</aside>

      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-[70] lg:hidden">
            <motion.div className="absolute inset-0 bg-black/40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} />
            <motion.aside initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "spring", stiffness: 380, damping: 38 }} className="absolute inset-y-0 left-0 w-[290px] max-w-[86vw] bg-bg px-3 py-6 shadow-float">
              <button type="button" onClick={() => setOpen(false)} className="absolute top-5 right-4 grid size-9 place-items-center rounded-full hover:bg-surface-2" aria-label="Close menu">
                <X className="size-5" />
              </button>
              {sidebar}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      <div className="min-w-0">
        <header className="glass sticky top-0 z-40 flex h-16 items-center justify-between gap-3 border-b border-line px-4 md:px-8">
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setOpen(true)} className="grid size-10 place-items-center rounded-full hover:bg-surface-2 lg:hidden" aria-label="Open menu">
              <Menu className="size-5" />
            </button>
            <span className="font-display text-lg text-ink lg:hidden">{NAV[area].title}</span>
          </div>
          <div className="flex items-center gap-1">
            <button type="button" onClick={toggle} className="grid size-10 place-items-center rounded-full text-ink hover:bg-surface-2" aria-label="Toggle theme">
              {theme === "dark" ? <Sun className="size-[19px]" /> : <Moon className="size-[19px]" />}
            </button>
            <NotificationBell />
            {area === "admin" && <ShieldCheck className="ml-1 size-5 text-accent" aria-label="Admin" />}
          </div>
        </header>
        {banner}
        <motion.main id="main" key={pathname} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: [0.25, 1, 0.5, 1] }} className="px-4 py-8 md:px-8 md:py-10">
          {children}
        </motion.main>
      </div>
    </div>
  );
}
