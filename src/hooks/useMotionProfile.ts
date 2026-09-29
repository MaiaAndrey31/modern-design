"use client";

import { useMediaQuery } from "@/hooks/useMediaQuery";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

/**
 * One place that decides how much motion a device gets:
 *  - `reduced`   prefers-reduced-motion → no parallax, pins, loops
 *  - `desktop`   ≥1024px wide → pinning, horizontal scroll, long scrubs
 *  - `hover`     fine pointer → hover-only effects, custom cursor
 * Mobile keeps native scroll, short reveals and nothing hover-dependent.
 */
export function useMotionProfile() {
  const reduced = usePrefersReducedMotion();
  const wide = useMediaQuery("(min-width: 1024px)");
  const hover = useMediaQuery("(hover: hover) and (pointer: fine)");
  return { reduced, desktop: wide && !reduced, hover: hover && !reduced };
}
