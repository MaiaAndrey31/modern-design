"use client";

import Image from "next/image";
import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, requestScrollRefresh } from "@/lib/gsap";
import type { StageDto } from "@/lib/content/legacyDto";
import { useMotionProfile } from "@/hooks/useMotionProfile";
import { useLocale } from "@/i18n/LocaleProvider";

const PLACEHOLDER = "/images/placeholder-stage.png";

/* ------------------------------------------------------------------ */
/* Mobile / reduced motion: full-bleed panels with a wipe reveal        */
/* ------------------------------------------------------------------ */

function StagePanel({ stage, reduced }: { stage: StageDto; reduced: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const { tc } = useLocale();

  useGSAP(
    () => {
      if (!ref.current || reduced) return;
      const trigger = { trigger: ref.current, start: "top 75%", once: true };
      gsap.fromTo(".stage-image", { clipPath: "inset(0 0 0 100%)" }, { clipPath: "inset(0 0 0 0%)", duration: 1.3, ease: "power4.inOut", scrollTrigger: trigger });
      gsap.fromTo(".stage-copy", { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 1, stagger: 0.1, delay: 0.45, ease: "expo.out", scrollTrigger: trigger });
    },
    { scope: ref, dependencies: [reduced], revertOnUpdate: true }
  );

  return (
    <div ref={ref} className="relative flex h-[78svh] min-h-[480px] w-full items-end overflow-hidden">
      <div className="stage-image absolute inset-0">
        <Image src={stage.imageUrl ?? PLACEHOLDER} alt={`${tc(stage.title)} — ${tc(stage.location)}`} fill sizes="100vw" className="object-cover" loading="lazy" />
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/30 to-bg/30" />
      </div>
      <div className="container-edit relative z-10 pb-12">
        <span className="stage-copy tabular block font-display text-2xl text-accent">{stage.year}</span>
        <h3 className="stage-copy mt-2 font-display uppercase leading-[0.9] tracking-tight" style={{ fontSize: "var(--font-size-h2)" }}>
          {tc(stage.title)}
        </h3>
        <p className="stage-copy eyebrow mt-4">{tc(stage.location)}</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Desktop: vertical scroll drives a horizontal journey                */
/* ------------------------------------------------------------------ */

function StagesHorizontal({ stages }: { stages: StageDto[] }) {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const { t, tc } = useLocale();

  useGSAP(
    () => {
      const section = sectionRef.current;
      const track = trackRef.current;
      if (!section || !track) return;

      const cards = gsap.utils.toArray<HTMLElement>(".ws-card", track);
      const parts = cards.map((card) => ({
        card,
        frame: card.querySelector<HTMLElement>(".ws-frame")!,
        shade: card.querySelector<HTMLElement>(".ws-shade")!,
        copy: card.querySelector<HTMLElement>(".ws-copy")!,
        center: 0,
      }));

      const measure = () => {
        parts.forEach((p) => {
          p.center = p.card.offsetLeft + p.card.offsetWidth / 2;
        });
      };
      const getDistance = () => Math.max(0, track.scrollWidth - window.innerWidth);

      // Focus falls off with distance from the viewport centre: scale 0.9→1,
      // image darkens less, copy fades in. Transforms/opacity only.
      const applyFocus = () => {
        const x = gsap.getProperty(track, "x") as number;
        const half = window.innerWidth / 2;
        parts.forEach((p) => {
          const d = gsap.utils.clamp(0, 1, Math.abs(p.center + x - half) / (window.innerWidth * 0.55));
          gsap.set(p.frame, { scale: 1 - 0.1 * d });
          gsap.set(p.shade, { opacity: 0.1 + 0.55 * d });
          gsap.set(p.copy, { opacity: gsap.utils.clamp(0, 1, 1 - d * 1.6), y: d * 20 });
        });
      };

      gsap.to(track, {
        x: () => -getDistance(),
        ease: "none",
        onUpdate: applyFocus,
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: () => `+=${getDistance()}`,
          scrub: 0.8,
          pin: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onRefresh: () => {
            measure();
            applyFocus();
          },
        },
      });

      gsap.fromTo(".ws-intro > *", { autoAlpha: 0, y: 30 }, {
        autoAlpha: 1, y: 0, duration: 1.1, stagger: 0.08, ease: "expo.out",
        scrollTrigger: { trigger: section, start: "top 70%", once: true },
      });

      measure();
      applyFocus();
      requestScrollRefresh();
    },
    { scope: sectionRef, dependencies: [stages.length] }
  );

  return (
    <section ref={sectionRef} aria-label={t.worldStages} className="relative h-screen overflow-hidden bg-bg">
      <div ref={trackRef} className="flex h-full w-max items-center will-change-transform">
        <div className="ws-intro flex w-[34vw] shrink-0 flex-col justify-center pl-[var(--gutter)] pr-12">
          <span className="eyebrow">
            {String(stages.length).padStart(2, "0")} — {t.worldStages}
          </span>
          <h2 className="mt-5 font-display uppercase leading-[0.9] tracking-tight" style={{ fontSize: "var(--font-size-h1)" }}>
            {t.worldStages}
          </h2>
          <span aria-hidden="true" className="mt-10 flex items-center gap-3 text-[10px] uppercase tracking-[0.3em] text-fg-muted">
            <span className="h-px w-12 bg-accent" /> →
          </span>
        </div>

        {stages.map((stage, i) => (
          <article
            key={stage.id}
            className="ws-card relative h-[70vh] w-[min(60vw,1100px)] shrink-0 px-[3vw]"
            // Offsets on a quiet diagonal, per the "journey" composition.
            style={{ transform: `translateY(${i % 2 === 0 ? -4 : 4}vh)` }}
          >
            <div className="ws-frame relative h-full w-full overflow-hidden will-change-transform">
              <Image
                src={stage.imageUrl ?? PLACEHOLDER}
                alt={`${tc(stage.title)} — ${tc(stage.location)}`}
                fill
                sizes="60vw"
                className="object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-bg/90 via-bg/10 to-transparent" />
              <div className="ws-shade absolute inset-0 bg-bg" />
              <span className="tabular absolute right-6 top-6 text-[10px] uppercase tracking-[0.3em] text-fg/70">
                {String(i + 1).padStart(2, "0")} / {String(stages.length).padStart(2, "0")}
              </span>
              <div className="ws-copy absolute inset-x-0 bottom-0 p-10 xl:p-14">
                <span className="tabular block font-display text-accent" style={{ fontSize: "var(--font-size-h3)" }}>
                  {stage.year}
                </span>
                <h3 className="mt-2 font-display uppercase leading-[0.9] tracking-tight" style={{ fontSize: "var(--font-size-h2)" }}>
                  {tc(stage.title)}
                </h3>
                {/* Showcase, not biography — the story is told in The Story. */}
                <p className="eyebrow mt-5">{tc(stage.location)}</p>
              </div>
            </div>
          </article>
        ))}
        <div aria-hidden="true" className="w-[20vw] shrink-0" />
      </div>
    </section>
  );
}

/** Scale over cards — a horizontal journey on desktop, full-bleed panels on touch/small screens. */
export function WorldStages({ stages }: { stages: StageDto[] }) {
  const { desktop, reduced } = useMotionProfile();
  const { t } = useLocale();

  if (stages.length === 0) return null;
  if (desktop && stages.length > 1) return <StagesHorizontal stages={stages} />;

  return (
    <section aria-label={t.worldStages} className="relative">
      <div className="container-edit pb-12 pt-[var(--section-padding-y)]">
        <span className="eyebrow">{String(stages.length).padStart(2, "0")} — {t.worldStages}</span>
        <h2 className="mt-4 font-display uppercase leading-[0.9] tracking-tight" style={{ fontSize: "var(--font-size-h2)" }}>
          {t.worldStages}
        </h2>
      </div>
      <div className="flex flex-col gap-2">
        {stages.map((stage) => (
          <StagePanel key={stage.id} stage={stage} reduced={reduced} />
        ))}
      </div>
    </section>
  );
}
