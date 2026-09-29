"use client";

import Image from "next/image";
import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, requestScrollRefresh } from "@/lib/gsap";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { useLocale } from "@/i18n/LocaleProvider";

interface NarrativeTransitionProps {
  lines: string[];
  finalWord: string;
  backgroundUrl: string | null;
  vhPerLine: number;
}

/** "The energy doesn't." → ["The energy", "doesn't."] — the last word gets its own line. */
function splitFinal(line: string): [string, string] {
  const words = line.trim().split(/\s+/);
  if (words.length < 2) return [line, ""];
  return [words.slice(0, -1).join(" "), words[words.length - 1]];
}

/**
 * The manifesto. A long sticky scroll where each statement rises out of a
 * mask and leaves before the next — never all at once — resolving into the
 * last line set huge across the viewport while the crowd behind it gains a
 * little light. One scroll-scrubbed timeline drives everything. Section
 * height is derived from `lines.length` so pacing survives CMS edits.
 */
export function NarrativeTransition({ lines, finalWord, backgroundUrl, vhPerLine }: NarrativeTransitionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const { tc } = useLocale();

  const translated = lines.map(tc);
  const leadLines = translated.slice(0, -1);
  const [finalA, finalB] = splitFinal(translated[translated.length - 1] ?? "");

  useGSAP(
    () => {
      if (!sectionRef.current || prefersReducedMotion || lines.length === 0) return;

      // A staggered fromTo inside a scrubbed timeline only pre-renders its
      // first target — set every masked line's start state explicitly.
      gsap.set(".mf-final, [class*='mf-lead-']", { yPercent: 110, y: 0 });

      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.8,
          invalidateOnRefresh: true,
        },
      });

      const total = leadLines.length + 1.6;
      tl.fromTo(".mf-bg", { scale: 1.18 }, { scale: 1, duration: total }, 0);

      leadLines.forEach((_, i) => {
        const at = i + 0.15;
        tl.fromTo(`.mf-lead-${i}`, { yPercent: 110, y: 0 }, { yPercent: 0, duration: 0.35, ease: "power3.out" }, at)
          .to(`.mf-lead-${i}`, { yPercent: -110, duration: 0.3, ease: "power3.in" }, at + 0.6)
          .fromTo(".mf-count", { textContent: i }, { textContent: i + 1, snap: { textContent: 1 }, duration: 0.01 }, at);
      });

      const finalAt = leadLines.length + 0.1;
      tl.fromTo(".mf-final", { yPercent: 110, y: 0 }, { yPercent: 0, duration: 0.5, stagger: 0.18, ease: "power3.out" }, finalAt)
        .fromTo(".mf-count", { textContent: leadLines.length }, { textContent: leadLines.length + 1, snap: { textContent: 1 }, duration: 0.01 }, finalAt)
        // The crowd gains a little light — nothing more.
        .to(".mf-shade", { opacity: 0.5, duration: 0.6, ease: "power1.inOut" }, finalAt)
        .fromTo(".mf-sign", { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.4, ease: "power2.out" }, finalAt + 0.55);

      requestScrollRefresh();
    },
    { scope: sectionRef, dependencies: [prefersReducedMotion, lines.length], revertOnUpdate: true }
  );

  if (lines.length === 0) return null;

  if (prefersReducedMotion) {
    return (
      <section aria-label="Manifesto" className="relative bg-bg py-[var(--section-padding-y)] text-center">
        <div className="container-edit space-y-6">
          {leadLines.map((line, i) => (
            <p key={i} className="font-display text-2xl uppercase tracking-tight md:text-4xl">
              {line}
            </p>
          ))}
          <p className="font-display uppercase leading-[1] tracking-tight" style={{ fontSize: "clamp(3rem, 11vw, 12rem)" }}>
            {finalA} <span className="text-accent">{finalB}</span>
          </p>
          <p className="eyebrow">— {finalWord}</p>
        </div>
      </section>
    );
  }

  // Height lives in CSS (shorter on phones) so it's correct from the first
  // paint — no post-hydration resize that would re-measure the pin.
  const heightVh = (lines.length + 1) * vhPerLine;

  return (
    <section
      ref={sectionRef}
      aria-label="Manifesto"
      className="relative h-[calc(var(--mf-h)*0.72)] md:h-[var(--mf-h)]"
      style={{ "--mf-h": `${heightVh}vh` } as React.CSSProperties}
    >
      <div className="sticky top-0 flex h-[100svh] items-center justify-center overflow-hidden">
        <div className="mf-bg absolute inset-0 will-change-transform">
          <Image
            src={backgroundUrl ?? "/images/placeholder-transition.png"}
            alt=""
            fill
            sizes="100vw"
            className="object-cover"
            loading="lazy"
          />
        </div>
        <div className="mf-shade absolute inset-0 bg-bg opacity-[0.78]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgb(5_5_5/0.7))]" />
        <div className="grain-overlay" />

        {/* Lead statements — one at a time, each in its own mask. */}
        {leadLines.map((line, i) => (
          <p
            key={i}
            className="absolute inset-x-0 top-1/2 -translate-y-1/2 px-[var(--gutter)] text-center font-display uppercase leading-[1.02] tracking-tight"
            style={{ fontSize: "var(--font-size-h1)" }}
          >
            <span className="line-mask">
              <span className={`mf-lead-${i}`}>{line}</span>
            </span>
          </p>
        ))}

        {/* The last line owns the viewport. */}
        <div className="relative z-10 w-full px-[var(--gutter)] text-center">
          <p className="font-display uppercase leading-[1] tracking-tight" style={{ fontSize: "clamp(3.25rem, 14vw, 17rem)" }}>
            <span className="line-mask">
              <span className="mf-final">{finalA}</span>
            </span>
            {finalB && (
              <span className="line-mask">
                <span className="mf-final text-accent">{finalB}</span>
              </span>
            )}
          </p>
          <p className="mf-sign eyebrow invisible mt-8 md:mt-10">— {finalWord}</p>
        </div>

        <div aria-hidden="true" className="tabular absolute bottom-8 left-[var(--gutter)] text-[10px] uppercase tracking-[0.3em] text-fg-muted">
          <span className="mf-count text-fg">0</span> / {lines.length}
        </div>
      </div>
    </section>
  );
}
