"use client";

import { useEffect, type ReactNode } from "react";
import Lenis from "lenis";
import { gsap, ScrollTrigger, requestScrollRefresh } from "@/lib/gsap";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { setActiveLenis } from "@/lib/lenisStore";

/**
 * Centralized smooth-scroll + ScrollTrigger sync. A single GSAP ticker drives
 * both Lenis' raf loop and every ScrollTrigger-based animation in the app —
 * this is the one place that owns the scroll rAF, avoiding duplicate loops
 * or desynced ScrollTriggers. When the user prefers reduced motion, Lenis is
 * skipped entirely and the browser's native scroll is used instead.
 */
export function SmoothScrollProvider({ children }: { children: ReactNode }) {
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion) return;

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    lenis.on("scroll", ScrollTrigger.update);
    setActiveLenis(lenis);

    const tickerCallback = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(tickerCallback);
    gsap.ticker.lagSmoothing(0);

    // Content now arrives from the CMS, so element sizes can change after
    // late-loading images/webfonts settle — re-measure ScrollTrigger once
    // both have finished so pin/scrub start-end points stay accurate.
    const onWindowLoad = () => requestScrollRefresh();
    window.addEventListener("load", onWindowLoad);
    document.fonts?.ready.then(requestScrollRefresh);

    return () => {
      gsap.ticker.remove(tickerCallback);
      gsap.ticker.lagSmoothing(500, 33);
      window.removeEventListener("load", onWindowLoad);
      setActiveLenis(null);
      lenis.destroy();
    };
  }, [prefersReducedMotion]);

  return <>{children}</>;
}
