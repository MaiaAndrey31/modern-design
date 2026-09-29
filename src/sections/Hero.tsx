"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";
import type { HeroDto, SiteDto } from "@/lib/content/dto";
import { useAppReady } from "@/hooks/useAppReady";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useInView } from "@/hooks/useInView";
import { MagneticButton } from "@/components/MagneticButton";
import { scrollToSection } from "@/lib/lenisStore";
import { track } from "@/lib/analytics";
import { youTubeBackgroundEmbedUrl } from "@/lib/youtube";
import { useLocale } from "@/i18n/LocaleProvider";

const HeroCanvas = dynamic(() => import("@/components/three/HeroCanvas"), { ssr: false });

const PLACEHOLDER = "/images/placeholder-hero.png";

interface HeroProps {
  hero: HeroDto;
  site: SiteDto;
}

export function Hero({ hero, site }: HeroProps) {
  const { isReady } = useAppReady();
  const { t, tc } = useLocale();
  const prefersReducedMotion = usePrefersReducedMotion();
  const isDesktop = useMediaQuery("(min-width: 1024px) and (hover: hover) and (pointer: fine)");
  const [sectionRef, isInView] = useInView<HTMLElement>({ threshold: 0 });
  const hasPlayedRef = useRef(false);

  const [isYouTubeVisible, setIsYouTubeVisible] = useState(false);

  const backgroundUrl = hero.backgroundUrl ?? PLACEHOLDER;
  // Reduced-motion visitors get the still image only. YouTube wins over an
  // uploaded MP4 (the admin only ever saves one of them anyway).
  const youtubeId = prefersReducedMotion ? null : hero.youtubeId;
  const videoUrl = prefersReducedMotion || youtubeId ? null : hero.videoUrl;
  const hasVideoBackground = Boolean(youtubeId || videoUrl);
  // The WebGL canvas paints the still image over everything — never with a
  // video. Mounted only after the preloader hands off, so its ~240 KB chunk
  // never competes with the LCP image for bandwidth.
  const enableWebGL = hero.enableWebgl && isDesktop && !prefersReducedMotion && !hasVideoBackground && isReady;
  const headlineLines = hero.headlineLines.length > 0 ? hero.headlineLines : [site.artistName];
  const eyebrow = hero.eyebrow ? tc(hero.eyebrow) : site.roles.map(tc).join(" · ");

  // Same-origin, optimized (avoids a cross-origin WebGL texture fetch, which
  // would fail CORS/taint the canvas once backgroundUrl is a Supabase URL —
  // and it doubles as free downscaling of the source the shader samples).
  const textureSrc = backgroundUrl.startsWith("/")
    ? backgroundUrl
    : `/_next/image?url=${encodeURIComponent(backgroundUrl)}&w=1920&q=75`;

  // Entrance. Initial states are applied on mount — the preloader covers the
  // page until then — and the sequence plays when the preloader's mask opens.
  useGSAP(
    () => {
      if (!sectionRef.current || hasPlayedRef.current) return;

      // Reduced motion can resolve after hydration — undo any hidden state.
      if (prefersReducedMotion) {
        gsap.set(".hero-line, .hero-sub, .hero-cta, .hero-scroll-cue, .hero-deco", { clearProps: "transform,opacity,visibility" });
        return;
      }

      if (!isReady) {
        gsap.set(".hero-line", { yPercent: 110, y: 0 });
        gsap.set(".hero-sub, .hero-cta, .hero-scroll-cue, .hero-deco", { autoAlpha: 0 });
        return;
      }
      hasPlayedRef.current = true;

      // .hero-frame holds the real LCP <Image> — it stays visible (opacity)
      // from first paint; only its scale animates, so LCP is never delayed.
      const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
      tl.fromTo(".hero-frame", { scale: 1.14 }, { scale: 1, duration: 2.2 }, 0)
        // ALAN → SAHER, each rising out of its own mask
        .fromTo(".hero-line", { yPercent: 110, y: 0 }, { yPercent: 0, duration: 1.3, stagger: 0.14 }, 0.45)
        .fromTo(".hero-sub", { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.9 }, 1.0)
        .fromTo(".hero-cta", { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.8, stagger: 0.1 }, 1.2)
        .fromTo(".hero-deco", { autoAlpha: 0 }, { autoAlpha: 1, duration: 1.2, ease: "power2.out" }, 1.35)
        .fromTo(".hero-scroll-cue", { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.8 }, 1.5);
    },
    { scope: sectionRef, dependencies: [isReady, prefersReducedMotion] }
  );

  // Depth on scroll: background drifts slower than the page, the decorative
  // layer faster, the headline keeps native speed and only dims.
  useGSAP(
    () => {
      const section = sectionRef.current;
      if (!section || prefersReducedMotion) return;
      const scrub = { trigger: section, start: "top top", end: "bottom top", scrub: true };
      gsap.to(".hero-parallax", { yPercent: isDesktop ? 16 : 10, ease: "none", scrollTrigger: scrub });
      gsap.to(".hero-deco-layer", { yPercent: -60, ease: "none", scrollTrigger: scrub });
      gsap.to(".hero-content", { autoAlpha: 0.15, ease: "power1.in", scrollTrigger: { ...scrub, start: "30% top" } });
    },
    { scope: sectionRef, dependencies: [prefersReducedMotion, isDesktop], revertOnUpdate: true }
  );

  return (
    <section
      id="top"
      ref={sectionRef}
      className="relative flex h-[100svh] min-h-[640px] w-full items-end overflow-hidden bg-bg"
    >
      <div className="hero-parallax absolute inset-0 will-change-transform">
        <div className="hero-frame absolute inset-0">
          <Image
            src={backgroundUrl}
            alt={`${site.artistName} performing on stage`}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          {videoUrl && (
            <video
              className="absolute inset-0 h-full w-full object-cover"
              autoPlay
              muted
              loop
              playsInline
              aria-hidden="true"
              poster={hero.posterUrl ?? backgroundUrl}
            >
              <source src={videoUrl} type="video/mp4" />
            </video>
          )}
          {/* Mounted only after the preloader so the embed never competes with
              the LCP image; stays invisible until YouTube's own loading UI is gone. */}
          {youtubeId && isReady && (
            <div
              aria-hidden="true"
              className={`pointer-events-none absolute inset-0 overflow-hidden transition-opacity duration-1000 [container-type:size] ${
                isYouTubeVisible ? "opacity-100" : "opacity-0"
              }`}
            >
              <iframe
                src={youTubeBackgroundEmbedUrl(youtubeId)}
                title="Background video"
                tabIndex={-1}
                allow="autoplay; encrypted-media; picture-in-picture"
                referrerPolicy="strict-origin-when-cross-origin"
                onLoad={() => window.setTimeout(() => setIsYouTubeVisible(true), 1200)}
                className="absolute left-1/2 top-1/2 h-[max(100cqh,56.25cqw)] w-[max(100cqw,177.78cqh)] -translate-x-1/2 -translate-y-1/2 scale-[1.15] border-0"
              />
            </div>
          )}
          {enableWebGL && <HeroCanvas imageSrc={textureSrc} active={isInView} />}
          <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/20 to-bg/50" />
          <div className="grain-overlay" />
        </div>
      </div>

      {/* Decorative depth layer — moves faster than the page on scroll. */}
      <div aria-hidden="true" className="hero-deco-layer pointer-events-none absolute inset-0 z-[5] hidden md:block">
        <div className="hero-deco absolute right-[var(--gutter)] top-[22%] flex flex-col items-end gap-3 text-right">
          <span className="h-16 w-px bg-accent/60" />
          <span className="eyebrow">{t.origin}</span>
          <span className="eyebrow tabular text-fg/70">Est. {site.startYear}</span>
        </div>
      </div>

      <div className="hero-content container-edit relative z-10 w-full pb-16 md:pb-24">
        <p className="hero-sub eyebrow mb-5">{eyebrow}</p>

        <h1 className="font-display leading-[0.88] tracking-tight" style={{ fontSize: "var(--font-size-display)" }}>
          {headlineLines.map((line, i) => (
            <span key={i} className="line-mask">
              <span className="hero-line">{line}</span>
            </span>
          ))}
        </h1>

        <div className="mt-8 flex flex-wrap items-center gap-x-10 gap-y-2">
          <MagneticButton className="hero-cta" cursorVariant="go" strength={0.22}>
            <button
              onClick={() => scrollToSection(hero.primaryCtaTarget)}
              className="group flex min-h-11 items-center gap-3 py-3 text-xs uppercase tracking-[0.25em]"
            >
              <span className="text-roll" data-text={tc(hero.primaryCtaLabel)}>
                <span>{tc(hero.primaryCtaLabel)}</span>
              </span>
              <span className="h-px w-8 origin-left bg-fg/60 transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:scale-x-150 group-hover:bg-accent" />
            </button>
          </MagneticButton>
          <MagneticButton className="hero-cta" cursorVariant="go" strength={0.22}>
            <button
              onClick={() => {
                track("hero_booking_click");
                scrollToSection(hero.secondaryCtaTarget);
              }}
              className="group flex min-h-11 items-center gap-3 py-3 text-xs uppercase tracking-[0.25em] text-accent"
            >
              <span className="text-roll" data-text={tc(hero.secondaryCtaLabel)}>
                <span>{tc(hero.secondaryCtaLabel)}</span>
              </span>
              <span className="h-px w-8 origin-left bg-accent/60 transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:scale-x-150" />
            </button>
          </MagneticButton>
        </div>
      </div>

      <div className="hero-scroll-cue absolute bottom-8 right-[var(--gutter)] z-10 hidden items-center gap-3 md:flex">
        <span className="text-[10px] uppercase tracking-[0.3em] text-fg-muted">{t.scroll}</span>
        <span className="relative block h-12 w-px overflow-hidden bg-fg/15">
          <span className="scroll-cue-line absolute inset-0 bg-fg/70" />
        </span>
      </div>
    </section>
  );
}
