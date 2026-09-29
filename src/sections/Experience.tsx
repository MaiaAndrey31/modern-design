"use client";

import Image from "next/image";
import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";
import type { FrameDto } from "@/lib/content/dto";
import { useMotionProfile } from "@/hooks/useMotionProfile";
import { useLocale } from "@/i18n/LocaleProvider";

// Tailwind v4 generates CSS by scanning source files — a class string read
// from the database would produce no CSS at all, so the CMS only ever picks
// an enum (FrameDto.layout) and this is the single place that maps it to a
// real, statically-written Tailwind class. Never read `layout` into a
// template-literal class name.
const ASPECT: Record<FrameDto["layout"], string> = {
  WIDE: "aspect-[16/10]",
  TALL: "aspect-[3/4]",
};

const FALLBACK_BY_SLOT: Record<number, string> = {
  1: "/images/placeholder-experience-1.png",
  2: "/images/placeholder-experience-2.png",
  3: "/images/placeholder-experience-3.png",
  4: "/images/placeholder-experience-4.png",
};

/**
 * Editorial placement per position (not per CMS slot, so any 2–4 frames
 * still compose). Mobile gets alternating widths instead of a grid.
 * `speed` is the scroll parallax in yPercent — tuned so neighbours drift
 * against each other without ever colliding.
 */
const PLACEMENT = [
  { cls: "w-[88%] md:col-start-1 md:col-span-6 md:w-auto", speed: -10 },
  { cls: "ml-auto w-[70%] md:ml-0 md:col-start-9 md:col-span-4 md:mt-[18vh] md:w-auto", speed: 12 },
  { cls: "w-[64%] md:col-start-2 md:col-span-4 md:w-auto", speed: -16 },
  { cls: "ml-auto w-[92%] md:ml-0 md:col-start-6 md:col-span-7 md:mt-[10vh] md:w-auto", speed: 8 },
];

/** "Lights, crowd, energy." → ["Lights,", "crowd,", "energy."] */
function splitWords(heading: string) {
  const parts = heading.split(/,\s*/).filter(Boolean);
  return parts.map((part, i) => (i < parts.length - 1 ? `${part},` : part));
}

function Word({ text, className, accent }: { text: string; className: string; accent?: boolean }) {
  return (
    <p
      aria-hidden="true"
      className={`ex-word font-display uppercase leading-[0.9] tracking-tight ${accent ? "text-accent" : "text-fg"} ${className}`}
      style={{ fontSize: "clamp(2.75rem, 1.5rem + 7vw, 9.5rem)" }}
    >
      <span className="line-mask">
        <span className="ex-word-inner">{text}</span>
      </span>
    </p>
  );
}

interface ExperienceProps {
  eyebrow: string;
  heading: string;
  frames: FrameDto[];
}

/** The live show as an editorial spread — words and frames at different sizes, positions and speeds. */
export function Experience({ eyebrow, heading, frames }: ExperienceProps) {
  const ref = useRef<HTMLElement>(null);
  const { desktop, reduced } = useMotionProfile();
  const { tc } = useLocale();

  const words = splitWords(tc(heading));
  const shown = frames.slice(0, 4);

  useGSAP(
    () => {
      const root = ref.current;
      if (!root || reduced) return;

      gsap.utils.toArray<HTMLElement>(".ex-word-inner", root).forEach((el) => {
        gsap.fromTo(el, { yPercent: 110, y: 0 }, { yPercent: 0, duration: 1.3, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 88%", once: true } });
      });

      gsap.utils.toArray<HTMLElement>(".ex-frame", root).forEach((frame, i) => {
        const inner = frame.querySelector(".ex-clip");
        gsap.fromTo(inner, { clipPath: "inset(100% 0% 0% 0%)" }, {
          clipPath: "inset(0% 0% 0% 0%)", duration: 1.4, ease: "power4.inOut",
          scrollTrigger: { trigger: frame, start: "top 85%", once: true },
        });
        gsap.fromTo(frame.querySelector(".ex-img"), { scale: 1.25 }, {
          scale: 1.08, duration: 1.8, ease: "expo.out",
          scrollTrigger: { trigger: frame, start: "top 85%", once: true },
        });

        // Parallax only where it reads as depth, not jitter.
        if (desktop) {
          gsap.to(frame, {
            yPercent: PLACEMENT[i]?.speed ?? 0,
            ease: "none",
            scrollTrigger: { trigger: frame, start: "top bottom", end: "bottom top", scrub: true },
          });
        }
      });

      if (desktop) {
        gsap.utils.toArray<HTMLElement>(".ex-word", root).forEach((el, i) => {
          gsap.fromTo(el, { xPercent: i % 2 ? 4 : -4 }, {
            xPercent: i % 2 ? -4 : 4, ease: "none",
            scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true },
          });
        });
      }
    },
    { scope: ref, dependencies: [reduced, desktop, shown.length], revertOnUpdate: true }
  );

  if (frames.length < 2) return null;

  const frameEl = (frame: FrameDto, i: number) => (
    <div
      key={frame.slot}
      className={`ex-frame will-change-transform ${PLACEMENT[i]?.cls ?? ""}`}
      style={desktop ? { marginTop: frame.offsetPx || undefined } : undefined}
    >
      <div className={`ex-clip relative w-full overflow-hidden ${ASPECT[frame.layout]}`}>
        <div className="ex-img absolute inset-0">
          <Image
            src={frame.mediaUrl ?? FALLBACK_BY_SLOT[frame.slot] ?? "/images/placeholder-experience-1.png"}
            alt={tc(frame.alt)}
            fill
            sizes="(min-width: 768px) 50vw, 90vw"
            className="object-cover"
            loading="lazy"
          />
        </div>
      </div>
    </div>
  );

  return (
    <section ref={ref} aria-label={tc(eyebrow)} className="relative overflow-hidden py-[var(--section-padding-y)]">
      <div className="container-edit">
        <span className="eyebrow">{tc(eyebrow)}</span>
        <h2 className="sr-only">{tc(heading)}</h2>

        <div className="mt-10 flex flex-col gap-12 md:grid md:grid-cols-12 md:gap-x-6 md:gap-y-16">
          {words[0] && <Word text={words[0]} className="md:col-start-5 md:col-span-8 md:text-right" />}
          {shown[0] && frameEl(shown[0], 0)}
          {shown[1] && frameEl(shown[1], 1)}
          {words[1] && <Word text={words[1]} className="md:col-start-3 md:col-span-9 md:-mt-[6vh]" />}
          {shown[2] && frameEl(shown[2], 2)}
          {shown[3] && frameEl(shown[3], 3)}
          {words.slice(2).map((word, i) => (
            <Word key={i} text={word} accent={i === words.length - 3} className="md:col-start-4 md:col-span-9" />
          ))}
        </div>
      </div>
    </section>
  );
}
