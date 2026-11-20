"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { Check } from "lucide-react";
import { ButtonLink } from "@/components/atoms/Button";
import { SmartImage } from "@/components/atoms/SmartImage";

/** Full-bleed promo with a slow parallax image. */
export function VendorPromo({ title, text, cta, images, commission }: { title: string; text: string; cta: string; images: string[]; commission: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y1 = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [60, -60]);
  const y2 = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [-40, 80]);
  const points = ["Products, services or both from one storefront", "Live booking calendar with your own hours", `Simple pricing: ${commission}% per completed sale, no monthly fee`];

  return (
    <section ref={ref} className="container-x">
      <div className="relative grid overflow-hidden rounded-[36px] bg-accent text-accent-ink lg:grid-cols-12">
        <div className="relative z-10 p-8 md:p-14 lg:col-span-6 lg:py-20">
          <p className="eyebrow !text-accent-ink/70">For makers and service pros</p>
          <h2 className="display-lg mt-4 text-balance">{title}</h2>
          <p className="mt-5 max-w-md text-[17px] text-accent-ink/85">{text}</p>
          <ul className="mt-8 space-y-3">
            {points.map((p) => (
              <li key={p} className="flex items-start gap-3 text-[15px]">
                <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-accent-ink/15">
                  <Check className="size-3" />
                </span>
                {p}
              </li>
            ))}
          </ul>
          <ButtonLink href="/become-vendor" variant="dark" size="lg" className="mt-10">
            {cta}
          </ButtonLink>
        </div>
        <div className="relative min-h-[340px] lg:col-span-6">
          {images[0] && (
            <motion.div style={{ y: y1 }} className="absolute top-[8%] right-[6%] h-[62%] w-[58%] overflow-hidden rounded-[28px] shadow-float">
              <SmartImage src={images[0]} alt="" fill sizes="40vw" />
            </motion.div>
          )}
          {images[1] && (
            <motion.div style={{ y: y2 }} className="absolute bottom-[6%] left-[6%] h-[48%] w-[44%] overflow-hidden rounded-[28px] border-4 border-accent shadow-float">
              <SmartImage src={images[1]} alt="" fill sizes="30vw" />
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}
