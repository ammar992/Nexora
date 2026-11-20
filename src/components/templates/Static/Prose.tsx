import { Reveal } from "@/components/atoms/Reveal";

/** Shared layout for long-form pages (terms, privacy, about). */
export function Prose({ eyebrow, title, intro, sections }: { eyebrow: string; title: string; intro?: string; sections: { h: string; p: string[] }[] }) {
  return (
    <div className="container-x pt-28 md:pt-36">
      <div className="grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-32">
            <p className="eyebrow">{eyebrow}</p>
            <h1 className="display-lg mt-4 text-ink">{title}</h1>
            {intro && <p className="mt-5 text-muted">{intro}</p>}
            <nav aria-label="On this page" className="mt-8 hidden space-y-2 lg:block">
              {sections.map((s, i) => (
                <a key={s.h} href={`#s${i}`} className="block text-sm text-muted hover:text-accent">
                  {String(i + 1).padStart(2, "0")} · {s.h}
                </a>
              ))}
            </nav>
          </div>
        </div>
        <div className="space-y-12 lg:col-span-7 lg:col-start-6">
          {sections.map((s, i) => (
            <Reveal key={s.h} as="section">
              <h2 id={`s${i}`} className="scroll-mt-32 font-display text-3xl text-ink">{s.h}</h2>
              <div className="mt-4 space-y-4 text-[16px] leading-[1.75] text-ink-soft">
                {s.p.map((p, j) => (
                  <p key={j}>{p}</p>
                ))}
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </div>
  );
}
