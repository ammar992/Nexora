"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useSyncExternalStore } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { CalendarCheck, Package, Star } from "lucide-react";
import { SearchBar } from "@/components/molecules/SearchBar";
import { LineReveal } from "@/components/atoms/Reveal";
import { useIsMobile } from "@/resources/hooks/useMediaQuery";
import { useTheme } from "@/context/ThemeContext";
import { formatMoney } from "@/resources/utils/format";

const HeroScene = dynamic(() => import("../three/HeroScene"), { ssr: false, loading: () => <SceneFallback /> });

function SceneFallback() {
  return (
    <div className="absolute inset-0 grid place-items-center" aria-hidden>
      <div className="relative size-[60%]">
        <span className="absolute inset-[18%] rounded-full bg-accent/70 blur-3xl" />
        <span className="absolute top-[10%] right-[8%] size-24 rounded-full border border-line-strong bg-surface/50 backdrop-blur" />
      </div>
    </div>
  );
}

let webglCache: boolean | undefined;
function hasWebGL() {
  if (webglCache !== undefined) return webglCache;
  try {
    const c = document.createElement("canvas");
    webglCache = !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    webglCache = false;
  }
  return webglCache;
}
const noopSubscribe = () => () => {};

type Spotlight = { title: string; slug: string; price: number; currency: string; type: "product" | "service"; rating: number } | null;

export function Hero({
  eyebrow,
  title,
  subtitle,
  categories,
  product,
  service,
  stats,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  categories: { slug: string; name: string }[];
  product: Spotlight;
  service: Spotlight;
  stats: { listings: number; vendors: number; cities: number };
}) {
  const reduce = useReducedMotion();
  const isMobile = useIsMobile();
  const { theme } = useTheme();
  // Device capabilities are read once on the client (null during SSR).
  const webgl = useSyncExternalStore(noopSubscribe, hasWebGL, () => null);
  const lowPower = useSyncExternalStore(noopSubscribe, () => (navigator.hardwareConcurrency ?? 8) <= 4, () => false);

  const { scrollY } = useScroll();
  const textY = useTransform(scrollY, [0, 600], [0, reduce ? 0 : -80]);
  const textOpacity = useTransform(scrollY, [0, 500], [1, reduce ? 1 : 0.15]);

  // Split the headline at the first sentence break for a two-line reveal.
  const parts = title.split(/(?<=\.)\s+/);
  const lines = parts.length > 1 ? parts : [title];

  return (
    <section className="relative isolate overflow-hidden pt-28 pb-16 md:pt-36 md:pb-24">
      {/* warm ground + faint grid */}
      <div aria-hidden className="absolute inset-0 -z-20 bg-[radial-gradient(120%_80%_at_80%_10%,var(--accent-soft),transparent_55%)]" />
      <div aria-hidden className="absolute inset-0 -z-20 opacity-[0.35] [background-image:linear-gradient(var(--line)_1px,transparent_1px),linear-gradient(90deg,var(--line)_1px,transparent_1px)] [background-size:72px_72px] [mask-image:radial-gradient(ellipse_at_70%_30%,black,transparent_70%)]" />

      <div className="container-x grid items-center gap-y-6 lg:grid-cols-12 lg:gap-x-8">
        <motion.div style={{ y: textY, opacity: textOpacity }} className="relative z-10 lg:col-span-7">
          <motion.p initial={reduce ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="eyebrow mb-6 inline-flex items-center gap-3">
            <span className="h-px w-10 bg-accent" aria-hidden />
            {eyebrow}
          </motion.p>
          <h1 className="display-xl text-ink">
            <LineReveal lines={lines.map((l, i) => (i === lines.length - 1 && lines.length > 1 ? <em key={i} className="font-normal text-accent italic">{l}</em> : l))} delay={0.1} />
          </h1>
          <motion.p initial={reduce ? false : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.45 }} className="mt-7 max-w-xl text-lg leading-relaxed text-muted text-pretty md:text-xl">
            {subtitle}
          </motion.p>
          <motion.div initial={reduce ? false : { opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.6 }} className="mt-10 max-w-3xl">
            <SearchBar categories={categories} />
            {categories.length > 0 && (
              <div className="mt-5 flex flex-wrap items-center gap-2 text-[13px]">
                <span className="text-muted">Popular:</span>
                {categories.slice(0, 4).map((c) => (
                  <Link key={c.slug} href={`/explore?category=${c.slug}`} className="rounded-full border border-line bg-surface/70 px-3 py-1 font-semibold text-ink-soft transition hover:border-accent hover:text-accent">
                    {c.name}
                  </Link>
                ))}
              </div>
            )}
          </motion.div>
        </motion.div>

        <div className="relative order-first h-[46vh] min-h-[320px] lg:order-none lg:col-span-5 lg:h-[640px]">
          {webgl === false ? <SceneFallback /> : webgl && <HeroScene lite={isMobile || lowPower} still={!!reduce} dark={theme === "dark"} />}
          {/* floating spotlight chips — live data from the catalog */}
          {product && (
            <motion.div initial={reduce ? false : { opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1, duration: 0.7 }} className="absolute top-[8%] right-0 hidden md:block">
              <Link href={`/listing/${product.slug}`} className="glass flex items-center gap-3 rounded-2xl border border-line px-4 py-3 shadow-lift transition hover:-translate-y-0.5">
                <span className="grid size-9 place-items-center rounded-xl bg-accent-soft text-accent">
                  <Package className="size-4" />
                </span>
                <span className="text-left">
                  <span className="block max-w-44 truncate text-[13px] font-semibold text-ink">{product.title}</span>
                  <span className="block text-[12px] text-muted">{formatMoney(product.price, product.currency)} · ships from the maker</span>
                </span>
              </Link>
            </motion.div>
          )}
          {service && (
            <motion.div initial={reduce ? false : { opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.2, duration: 0.7 }} className="absolute bottom-[10%] left-0 hidden md:block">
              <Link href={`/listing/${service.slug}`} className="glass flex items-center gap-3 rounded-2xl border border-line px-4 py-3 shadow-lift transition hover:-translate-y-0.5">
                <span className="grid size-9 place-items-center rounded-xl bg-ink text-bg">
                  <CalendarCheck className="size-4" />
                </span>
                <span className="text-left">
                  <span className="block max-w-44 truncate text-[13px] font-semibold text-ink">{service.title}</span>
                  <span className="flex items-center gap-1 text-[12px] text-muted">
                    {service.rating > 0 && (
                      <>
                        <Star className="size-3 text-accent" fill="currentColor" /> {service.rating.toFixed(1)} ·
                      </>
                    )}{" "}
                    book a time that suits you
                  </span>
                </span>
              </Link>
            </motion.div>
          )}
        </div>
      </div>

      {stats.listings > 0 && (
        <div className="container-x mt-14 md:mt-20">
          <dl className="grid grid-cols-3 gap-4 border-t border-line pt-8 md:max-w-2xl">
            {[
              { k: "Live listings", v: stats.listings },
              { k: "Independent vendors", v: stats.vendors },
              { k: "Cities", v: stats.cities },
            ].map((s) => (
              <div key={s.k}>
                <dt className="text-[13px] text-muted">{s.k}</dt>
                <dd className="mt-1 font-display text-3xl text-ink md:text-4xl">{s.v.toLocaleString()}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </section>
  );
}
