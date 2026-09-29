"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";
import { CountUp } from "@/components/CountUp";
import { useLocale } from "@/i18n/LocaleProvider";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

interface NumbersProps {
  startYear: number;
  stageYears: { id: string; year: string }[];
}

/**
 * Editorial credentials — typography, one rule and negative space. The years
 * count up on entry, the 1993 ─── today rule is drawn by scroll, and the
 * world-stage years follow with a stagger.
 */
export function Numbers({ startYear, stageYears }: NumbersProps) {
  const ref = useRef<HTMLElement>(null);
  const { t } = useLocale();
  const prefersReducedMotion = usePrefersReducedMotion();
  const currentYear = new Date().getFullYear();
  const years = Math.max(0, currentYear - startYear);
  const curatedStages = stageYears.slice(0, 6);

  useGSAP(
    () => {
      if (!ref.current || prefersReducedMotion) return;

      gsap.fromTo(
        ".nb-rule",
        { scaleX: 0 },
        { scaleX: 1, ease: "none", scrollTrigger: { trigger: ".nb-rule-wrap", start: "top 90%", end: "top 45%", scrub: 0.6 } }
      );
      gsap.fromTo(
        ".nb-fade",
        { autoAlpha: 0, y: 24 },
        { autoAlpha: 1, y: 0, duration: 1.1, stagger: 0.08, ease: "expo.out", scrollTrigger: { trigger: ref.current, start: "top 75%", once: true } }
      );
      gsap.fromTo(
        ".nb-year",
        { yPercent: 110, y: 0 },
        { yPercent: 0, duration: 1.1, stagger: 0.09, ease: "expo.out", scrollTrigger: { trigger: ".nb-years", start: "top 85%", once: true } }
      );
    },
    { scope: ref, dependencies: [prefersReducedMotion], revertOnUpdate: true }
  );

  if (years === 0 && curatedStages.length === 0) return null;

  return (
    <section ref={ref} aria-label="Numbers" className="relative py-[var(--section-padding-y)]">
      <div className="container-edit">
        <h2 className="sr-only">
          {years}+ years, performances across major world stages since {startYear}.
        </h2>
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-12 lg:gap-8">
          {years > 0 && (
            <div className="lg:col-span-6">
              <span className="nb-fade eyebrow block">
                {t.since} {startYear}
              </span>
              <div className="mt-4 flex items-baseline gap-3">
                <CountUp
                  to={years}
                  suffix="+"
                  pad={2}
                  className="font-display text-[clamp(5rem,16vw,13rem)] leading-[0.85] tracking-tight"
                />
                <span className="nb-fade font-display text-2xl uppercase text-fg-muted md:text-4xl">{t.years}</span>
              </div>
            </div>
          )}

          {curatedStages.length > 0 && (
            <div className="lg:col-span-6 lg:self-end lg:border-l lg:border-border lg:pl-12">
              <span className="nb-fade eyebrow block">{t.worldStages}</span>
              <ul className="nb-years mt-6 flex flex-wrap gap-x-10 gap-y-4">
                {curatedStages.map((stage) => (
                  <li key={stage.id} className="line-mask">
                    <span className="nb-year tabular font-display text-3xl tracking-tight md:text-5xl">{stage.year}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {years > 0 && (
          <div aria-hidden="true" className="nb-rule-wrap mt-16 flex items-center gap-5 text-[11px] tracking-[0.3em] text-fg-muted md:mt-24">
            <span className="tabular font-display">{startYear}</span>
            <span className="relative h-px flex-1 bg-fg/10">
              <span className="nb-rule absolute inset-0 origin-left bg-gradient-to-r from-fg/40 to-accent" />
            </span>
            <span className="tabular font-display text-fg">{currentYear}</span>
          </div>
        )}
      </div>
    </section>
  );
}
