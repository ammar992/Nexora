"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { Search, CalendarClock, ShieldCheck, PackageCheck } from "lucide-react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const STEPS = [
  { icon: Search, title: "Find the right maker or pro", body: "Search by what you need, where you are and what you want to spend. Every vendor is reviewed by our team before they can list." },
  { icon: CalendarClock, title: "Pick a piece or a time", body: "Add products to your cart, or choose an open slot on the vendor's live calendar. Availability is checked the moment you book." },
  { icon: ShieldCheck, title: "Pay the way that suits you", body: "Pay securely online by card, or pay the vendor on delivery or at your appointment. We never store your card details." },
  { icon: PackageCheck, title: "Track it to the finish", body: "Follow your order or booking from your account, hear from the vendor directly, and leave a review once it's done." },
];

/**
 * Pinned scroll sequence on desktop: the section holds while each step slides in and the
 * progress line fills. On small screens / reduced motion it renders as a simple list.
 */
export function HowItWorks() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(min-width: 1024px) and (prefers-reduced-motion: no-preference)", () => {
        const cards = gsap.utils.toArray<HTMLElement>("[data-step]");
        const tl = gsap.timeline({
          scrollTrigger: { trigger: root.current, start: "top top", end: `+=${cards.length * 70}%`, scrub: 0.6, pin: true },
        });
        tl.fromTo("[data-progress]", { scaleY: 0 }, { scaleY: 1, ease: "none", duration: cards.length }, 0);
        cards.forEach((card, i) => {
          tl.fromTo(card, { opacity: 0.15, x: 60 }, { opacity: 1, x: 0, duration: 0.6, ease: "power2.out" }, i * 0.9);
          tl.fromTo(card.querySelector("[data-num]"), { color: "var(--muted)" }, { color: "var(--accent)", duration: 0.3 }, i * 0.9);
        });
      });
      mm.add("(max-width: 1023px), (prefers-reduced-motion: reduce)", () => {
        gsap.utils.toArray<HTMLElement>("[data-step]").forEach((card) => {
          gsap.from(card, { opacity: 0, y: 24, duration: 0.6, ease: "power2.out", scrollTrigger: { trigger: card, start: "top 88%" } });
        });
      });
      return () => mm.revert();
    },
    { scope: root }
  );

  return (
    <section ref={root} className="relative overflow-hidden bg-ink py-24 text-bg lg:flex lg:min-h-screen lg:items-center lg:py-0">
      <div aria-hidden className="absolute -top-40 -left-40 size-[520px] rounded-full bg-accent/25 blur-[120px]" />
      <div className="container-x relative grid gap-14 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <p className="eyebrow !text-bg/50">How it works</p>
          <h2 className="display-lg mt-4 text-balance">From first search to finished, in four steps.</h2>
          <p className="mt-6 max-w-md text-[17px] text-bg/65">The same simple flow whether you&apos;re ordering a hand-thrown bowl or booking a two-hour session.</p>
        </div>
        <div className="relative lg:col-span-6 lg:col-start-7">
          <span aria-hidden className="absolute top-2 bottom-2 left-[19px] w-px bg-bg/15" />
          <span data-progress aria-hidden className="absolute top-2 bottom-2 left-[19px] w-px origin-top scale-y-0 bg-accent max-lg:hidden" />
          <ol className="space-y-10">
            {STEPS.map((s, i) => (
              <li key={s.title} data-step className="relative flex gap-6 pl-0">
                <span className="relative z-10 grid size-10 shrink-0 place-items-center rounded-full border border-bg/20 bg-ink">
                  <s.icon className="size-[18px]" aria-hidden />
                </span>
                <div>
                  <p data-num className="font-display text-sm text-bg/50">0{i + 1}</p>
                  <h3 className="mt-1 font-display text-2xl md:text-3xl">{s.title}</h3>
                  <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-bg/65">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
