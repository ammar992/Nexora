import Link from "next/link";

export default function NotFound() {
  return (
    <main id="main" className="grid min-h-dvh place-items-center px-4">
      <div className="text-center">
        <p className="font-display text-[clamp(7rem,22vw,16rem)] leading-none tracking-[-0.06em] text-accent">404</p>
        <h1 className="mt-2 font-display text-4xl text-ink">This page wandered off.</h1>
        <p className="mx-auto mt-3 max-w-sm text-muted">The link may be old, or the listing is no longer available.</p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/" className="inline-flex h-12 items-center rounded-full bg-ink px-6 text-sm font-semibold text-bg">Go home</Link>
          <Link href="/explore" className="inline-flex h-12 items-center rounded-full border border-line px-6 text-sm font-semibold text-ink">Explore</Link>
        </div>
      </div>
    </main>
  );
}
