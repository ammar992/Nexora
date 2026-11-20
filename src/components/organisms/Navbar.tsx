"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "framer-motion";
import {
  ShoppingBag, Menu, X, Moon, Sun, User, LayoutDashboard, Store, ShieldCheck, LogOut, Heart, Package, CalendarDays, ChevronDown, ArrowUpRight,
} from "lucide-react";
import { Logo } from "@/components/atoms/Logo";
import { Avatar } from "@/components/atoms/Avatar";
import { ButtonLink } from "@/components/atoms/Button";
import { Dropdown, MenuItem } from "@/components/molecules/Dropdown";
import { NotificationBell } from "./NotificationBell";
import { CategoryIcon } from "@/components/atoms/CategoryIcon";
import { useSession } from "@/context/SessionContext";
import { useTheme } from "@/context/ThemeContext";
import { useAppDispatch, useAppSelector, selectCartCount } from "@/store";
import { setDrawer } from "@/store/cart/cartSlice";
import { useIsClient } from "@/resources/hooks/useIsClient";
import { cn } from "@/resources/utils/cn";

type NavCategory = { slug: string; name: string; icon: string; type: string; count: number };

const LINKS = [
  { href: "/explore", label: "Explore" },
  { href: "/explore?type=product", label: "Shop" },
  { href: "/explore?type=service", label: "Book" },
  { href: "/vendors", label: "Vendors" },
];

function useActive() {
  const pathname = usePathname();
  const search = useSearchParams();
  return (href: string) => {
    const [path, qs] = href.split("?");
    if (pathname !== path) return false;
    const type = search.get("type");
    const want = new URLSearchParams(qs ?? "").get("type");
    return (type ?? null) === (want ?? null);
  };
}

export function Navbar({ siteName, logoUrl, categories }: { siteName: string; logoUrl?: string; categories: NavCategory[] }) {
  const { user, logout } = useSession();
  const { theme, toggle } = useTheme();
  const dispatch = useAppDispatch();
  const isClient = useIsClient();
  const storedCount = useAppSelector(selectCartCount);
  const count = isClient ? storedCount : 0;
  const pathname = usePathname();
  const isActive = useActive();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (y) => {
    const prev = scrollY.getPrevious() ?? 0;
    setScrolled(y > 12);
    setHidden(y > 400 && y > prev && !mobileOpen && !megaOpen);
  });
  // Close menus whenever the route changes.
  const [seenPath, setSeenPath] = useState(pathname);
  if (pathname !== seenPath) {
    setSeenPath(pathname);
    setMobileOpen(false);
    setMegaOpen(false);
  }
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
  }, [mobileOpen]);

  const dashboard = user?.role === "admin" ? { href: "/admin", label: "Admin console", icon: <ShieldCheck /> } : user?.role === "vendor" ? { href: "/vendor", label: "Vendor dashboard", icon: <Store /> } : null;

  return (
    <>
      <motion.header
        animate={{ y: hidden ? "-110%" : "0%" }}
        transition={{ duration: 0.35, ease: [0.25, 1, 0.5, 1] }}
        className="fixed inset-x-0 top-0 z-50 px-3 pt-3 md:px-5"
        onMouseLeave={() => setMegaOpen(false)}
      >
        <nav
          aria-label="Main"
          className={cn(
            "container-x relative flex h-16 items-center justify-between gap-4 rounded-full transition-all duration-500 md:h-[68px]",
            scrolled || megaOpen ? "glass border border-line shadow-lift" : "border border-transparent"
          )}
        >
          <Logo name={siteName} logoUrl={logoUrl} className="shrink-0" />

          <ul className="hidden items-center gap-1 lg:flex">
            {LINKS.map((l) => {
              const active = isActive(l.href);
              const isExplore = l.href === "/explore";
              return (
                <li key={l.href} onMouseEnter={() => setMegaOpen(isExplore)}>
                  <Link href={l.href} className={cn("relative inline-flex items-center gap-1 rounded-full px-4 py-2 text-sm font-semibold transition-colors", active ? "text-ink" : "text-muted hover:text-ink")} aria-current={active ? "page" : undefined}>
                    {active && <motion.span layoutId="nav-active" className="absolute inset-0 -z-10 rounded-full bg-surface-2" transition={{ type: "spring", stiffness: 450, damping: 35 }} />}
                    {l.label}
                    {isExplore && <ChevronDown className={cn("size-3.5 transition-transform", megaOpen && "rotate-180")} />}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="flex items-center gap-1">
            <button type="button" onClick={toggle} className="hidden size-10 place-items-center rounded-full text-ink transition hover:bg-surface-2 sm:grid" aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}>
              <AnimatePresence mode="wait" initial={false}>
                <motion.span key={theme} initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
                  {theme === "dark" ? <Sun className="size-[19px]" /> : <Moon className="size-[19px]" />}
                </motion.span>
              </AnimatePresence>
            </button>
            {user && <NotificationBell />}
            <button type="button" onClick={() => dispatch(setDrawer(true))} className="relative grid size-10 place-items-center rounded-full text-ink transition hover:bg-surface-2" aria-label={`Open cart, ${count} item${count === 1 ? "" : "s"}`}>
              <ShoppingBag className="size-[19px]" />
              <AnimatePresence>
                {count > 0 && (
                  <motion.span key={count} initial={{ scale: 0.3 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ type: "spring", stiffness: 600, damping: 15 }} className="absolute top-1 right-1 grid min-w-[18px] place-items-center rounded-full bg-accent px-1 text-[10px] leading-[18px] font-bold text-accent-ink">
                    {count > 99 ? "99+" : count}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>

            {user ? (
              <div className="hidden sm:block">
                <Dropdown
                  label="Account menu"
                  trigger={(open) => (
                    <span className={cn("ml-1 flex items-center gap-2 rounded-full border border-line bg-surface py-1 pr-3 pl-1 transition", open && "border-line-strong")}>
                      <Avatar name={user.name} src={user.avatar} size={32} />
                      <ChevronDown className={cn("size-3.5 text-muted transition-transform", open && "rotate-180")} />
                    </span>
                  )}
                >
                  {(close) => (
                    <>
                      <div className="px-3 pt-2 pb-3">
                        <p className="truncate text-sm font-semibold text-ink">{user.name}</p>
                        <p className="truncate text-[13px] text-muted">{user.email}</p>
                      </div>
                      <div className="my-1 h-px bg-line" />
                      {dashboard && (
                        <MenuItem href={dashboard.href} icon={dashboard.icon} onClick={close}>
                          {dashboard.label}
                        </MenuItem>
                      )}
                      <MenuItem href="/account" icon={<LayoutDashboard />} onClick={close}>My account</MenuItem>
                      <MenuItem href="/account/orders" icon={<Package />} onClick={close}>Orders</MenuItem>
                      <MenuItem href="/account/bookings" icon={<CalendarDays />} onClick={close}>Bookings</MenuItem>
                      <MenuItem href="/account/saved" icon={<Heart />} onClick={close}>Saved</MenuItem>
                      {user.role === "customer" && (
                        <MenuItem href="/become-vendor" icon={<Store />} onClick={close}>
                          {user.vendorStatus === "pending" ? "Application status" : "Sell on " + siteName}
                        </MenuItem>
                      )}
                      <div className="my-1 h-px bg-line" />
                      <MenuItem icon={<LogOut />} danger onClick={() => { close(); logout(); }}>
                        Sign out
                      </MenuItem>
                    </>
                  )}
                </Dropdown>
              </div>
            ) : (
              <div className="hidden items-center gap-1 sm:flex">
                <Link href="/login" className="rounded-full px-4 py-2 text-sm font-semibold text-ink transition hover:bg-surface-2">
                  Sign in
                </Link>
                <ButtonLink href="/register" size="sm" variant="dark">
                  Join
                </ButtonLink>
              </div>
            )}

            <button type="button" onClick={() => setMobileOpen((o) => !o)} className="grid size-10 place-items-center rounded-full text-ink transition hover:bg-surface-2 lg:hidden" aria-label={mobileOpen ? "Close menu" : "Open menu"} aria-expanded={mobileOpen}>
              {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>

          {/* Explore mega menu */}
          <AnimatePresence>
            {megaOpen && categories.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22, ease: [0.25, 1, 0.5, 1] }}
                className="absolute inset-x-0 top-[calc(100%+10px)] hidden overflow-hidden rounded-[32px] border border-line bg-surface p-6 shadow-float lg:block"
              >
                <div className="grid grid-cols-12 gap-6">
                  <div className="col-span-8 grid grid-cols-2 gap-1">
                    {categories.slice(0, 8).map((c, i) => (
                      <motion.div key={c.slug} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                        <Link href={`/explore?category=${c.slug}`} className="group flex items-center gap-3 rounded-2xl p-3 transition hover:bg-surface-2">
                          <span className="grid size-10 place-items-center rounded-xl bg-accent-soft text-accent transition group-hover:bg-accent group-hover:text-accent-ink">
                            <CategoryIcon name={c.icon} className="size-[18px]" />
                          </span>
                          <span>
                            <span className="block text-sm font-semibold text-ink">{c.name}</span>
                            <span className="block text-[12px] text-muted">{c.count} listing{c.count === 1 ? "" : "s"}</span>
                          </span>
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                  <Link href="/become-vendor" className="group relative col-span-4 flex flex-col justify-end overflow-hidden rounded-3xl bg-ink p-6 text-bg">
                    <span className="absolute -top-10 -right-10 size-40 rounded-full bg-accent/80 blur-2xl transition-transform duration-700 group-hover:scale-125" aria-hidden />
                    <span className="eyebrow relative !text-bg/60">For makers & pros</span>
                    <span className="relative mt-2 font-display text-2xl leading-tight">Open a storefront in an afternoon.</span>
                    <span className="relative mt-4 inline-flex items-center gap-1 text-sm font-semibold">
                      Start selling <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </span>
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </nav>
      </motion.header>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 overflow-y-auto bg-bg/98 px-4 pt-24 pb-10 backdrop-blur-xl lg:hidden">
            <motion.ul initial="hidden" animate="show" variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }} className="space-y-1">
              {[...LINKS, ...(user ? [{ href: "/account", label: "My account" }] : [])].map((l) => (
                <motion.li key={l.href} variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}>
                  <Link href={l.href} className="flex items-center justify-between border-b border-line py-4 font-display text-[2rem] text-ink" onClick={() => setMobileOpen(false)}>
                    {l.label}
                    <ArrowUpRight className="size-6 text-muted" />
                  </Link>
                </motion.li>
              ))}
            </motion.ul>
            <div className="mt-8 grid grid-cols-2 gap-2">
              {categories.slice(0, 6).map((c) => (
                <Link key={c.slug} href={`/explore?category=${c.slug}`} onClick={() => setMobileOpen(false)} className="flex items-center gap-2 rounded-2xl border border-line bg-surface p-3 text-sm font-semibold text-ink">
                  <CategoryIcon name={c.icon} className="size-4 text-accent" />
                  <span className="truncate">{c.name}</span>
                </Link>
              ))}
            </div>
            <div className="mt-8 flex flex-col gap-3">
              {dashboard && (
                <ButtonLink href={dashboard.href} variant="dark" size="lg" onClick={() => setMobileOpen(false)}>
                  {dashboard.label}
                </ButtonLink>
              )}
              {user ? (
                <button type="button" onClick={logout} className="inline-flex h-14 items-center justify-center gap-2 rounded-full border border-line font-semibold text-danger">
                  <LogOut className="size-4" /> Sign out
                </button>
              ) : (
                <>
                  <ButtonLink href="/register" size="lg">Create an account</ButtonLink>
                  <ButtonLink href="/login" variant="secondary" size="lg">
                    <User className="size-4" /> Sign in
                  </ButtonLink>
                </>
              )}
              <button type="button" onClick={toggle} className="inline-flex h-12 items-center justify-center gap-2 text-sm font-semibold text-muted">
                {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />} {theme === "dark" ? "Light" : "Dark"} theme
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
