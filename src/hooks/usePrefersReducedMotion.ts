"use client";

import { useMediaQuery } from "@/hooks/useMediaQuery";

/** Tracks `prefers-reduced-motion` live, including changes after mount. */
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}
