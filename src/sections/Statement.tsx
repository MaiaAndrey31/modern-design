"use client";

import { useRef } from "react";
import Image from "next/image";
import { useGSAP } from "@gsap/react";
import { gsap, requestScrollRefresh } from "@/lib/gsap";
import { useMotionProfile } from "@/hooks/useMotionProfile";
import { useLocale } from "@/i18n/LocaleProvider";
import { MinasGlobe } from "@/components/three/MinasGlobe";
import { STORY_COPY } from "@/i18n/story";
import type { GlobeHandle } from "@/components/three/globeScene";

interface StatementProps {
  lines: string[];
  accentIndex: number | null;
  backgroundUrl: string | null;
}

const DEFAULT_BACKGROUND = "/images/statement-bg.jpg";

/**
 * "From Minas to the World" — the origin chapter. A tall section with a
 * sticky stage: each line rises out of its mask one after another while the
 * photograph slowly settles, a warm light drifts across, a route line draws
 * out from Minas and (desktop) a globe connects Minas to the world.
 * Every beat is scroll-scrubbed — nothing autoplays.
 */
export function Statement({ lines, accentIndex, backgroundUrl }: StatementProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const globeRef = useRef<GlobeHandle | null>(null);
  const { reduced, desktop } = useMotionProfile();
  const { t, tc, locale } = useLocale();

  useGSAP(
    () => {
      const section = sectionRef.current;
      if (!section || reduced || lines.length === 0) return;

      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: section,
          start: "top 65%",
          end: "bottom bottom",
          scrub: 0.8,
          invalidateOnRefresh: true,
          onUpdate: (self) => globeRef.current?.setProgress(self.progress),
        },
      });

      const step = 6 / lines.length;
      tl.fromTo(".st-bg", { scale: 1.18 }, { scale: 1, duration: 10 }, 0)
        .fromTo(".st-light", { xPercent: -35, autoAlpha: 0 }, { xPercent: 35, autoAlpha: 1, duration: 10 }, 0)
        .fromTo(".st-eyebrow", { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 1, ease: "power2.out" }, 0);

      gsap.utils.toArray<HTMLElement>(".st-line", section).forEach((line, i) => {
        tl.fromTo(line, { yPercent: 115, y: 0 }, { yPercent: 0, duration: 1.6, ease: "power3.out" }, 0.4 + i * step);
      });

      tl.fromTo(".st-route", { scaleX: 0 }, { scaleX: 1, duration: 6 }, 1.5)
        .fromTo(".st-route-end", { autoAlpha: 0 }, { autoAlpha: 1, duration: 1 }, 7)
        // The thesis raises the question The Story answers next.
        .fromTo(".st-how", { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 1, ease: "power2.out" }, 8)
        .to({}, { duration: 1.5 });

      requestScrollRefresh();
    },
    { scope: sectionRef, dependencies: [reduced, desktop, lines.length], revertOnUpdate: true }
  );

  if (lines.length === 0) return null;

  const heading = (
    <h2 className="font-display uppercase leading-[0.92] tracking-tight" style={{ fontSize: "var(--font-size-h1)" }}>
      {lines.map((line, i) => (
        <span key={i} className="line-mask">
          <span className={`st-line ${i === accentIndex ? "text-accent" : "text-fg"}`}>{tc(line)}</span>
        </span>
      ))}
    </h2>
  );

  const background = (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
      <div className="st-bg absolute inset-0 will-change-transform">
        <Image
          src={backgroundUrl ?? DEFAULT_BACKGROUND}
          alt=""
          fill
          sizes="100vw"
          loading="lazy"
          className="object-cover object-[70%_center] md:object-right"
        />
      </div>
      {/* Warm light that drifts across as the story moves from origin to world. */}
      <div className="st-light absolute inset-y-0 left-1/4 w-1/2 bg-[radial-gradient(closest-side,rgb(217_169_78/0.14),transparent)] opacity-0" />
      {/* Left-to-right fade keeps the headline legible; top/bottom fades blend into neighbouring sections. */}
      <div className="absolute inset-0 bg-gradient-to-r from-bg via-bg/80 to-bg/10 md:via-bg/60 md:to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-b from-bg via-transparent to-bg" />
      <div className="grain-overlay" />
    </div>
  );

  if (reduced) {
    return (
      <section aria-label="Statement" className="relative flex min-h-[80svh] items-center overflow-hidden py-[var(--section-padding-y)]">
        {background}
        <div className="container-edit relative z-10 w-full">
          <p className="eyebrow mb-6">{t.origin}</p>
          {heading}
        </div>
      </section>
    );
  }

  return (
    <section ref={sectionRef} aria-label="Statement" className="relative h-[170svh] lg:h-[220vh]">
      <div className="sticky top-0 flex h-[100svh] items-center overflow-hidden">
        {background}

        {desktop && (
          <MinasGlobe
            handleRef={globeRef}
            className="pointer-events-none absolute right-[4vw] top-1/2 aspect-square w-[min(46vw,78vh)] -translate-y-1/2"
          />
        )}

        <div className="container-edit relative z-10 w-full">
          <p className="st-eyebrow eyebrow mb-6 flex items-center gap-3">
            <span className="inline-block size-1.5 rounded-full bg-accent" />
            {t.origin}
          </p>
          {heading}

          {/* Route: origin dot → line drawn by scroll → world. */}
          <div aria-hidden="true" className="mt-10 flex max-w-md items-center gap-4 text-[10px] uppercase tracking-[0.3em] text-fg-muted md:mt-14">
            <span className="tabular">21°S 45°W</span>
            <span className="relative h-px flex-1 bg-fg/10">
              <span className="st-route absolute inset-0 origin-left bg-accent/80" />
            </span>
            <span className="st-route-end flex items-center gap-2 text-fg/80">
              <span className="size-1.5 rounded-full border border-fg/60" />
              {tc("World.").replace(".", "")}
            </span>
          </div>

          <p aria-hidden="true" className="st-how invisible mt-12 flex items-center gap-4 font-display text-2xl uppercase tracking-tight md:mt-16 md:text-3xl">
            {STORY_COPY.how[locale]}
            <span className="text-base text-accent motion-safe:animate-bounce">↓</span>
          </p>
        </div>
      </div>
    </section>
  );
}
