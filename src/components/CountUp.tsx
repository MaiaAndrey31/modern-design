"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

interface CountUpProps {
  to: number;
  suffix?: string;
  className?: string;
  duration?: number;
  /** Minimum digits (e.g. 2 → "00", "08", "17"…). */
  pad?: number;
}

/**
 * Counts from zero the first time it enters the viewport. Driven by a
 * one-shot ScrollTrigger (no IntersectionObserver re-renders), writes to the
 * DOM directly, and uses tabular figures so the width never jitters.
 */
export function CountUp({ to, suffix = "", className, duration = 2, pad = 1 }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const format = (value: number) => `${String(Math.round(value)).padStart(pad, "0")}${suffix}`;

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      if (prefersReducedMotion) {
        el.textContent = format(to);
        return;
      }
      const counter = { value: 0 };
      el.textContent = format(0);
      gsap.to(counter, {
        value: to,
        duration,
        ease: "power3.out",
        onUpdate: () => {
          el.textContent = format(counter.value);
        },
        scrollTrigger: { trigger: el, start: "top 85%", once: true },
      });
    },
    { dependencies: [to, prefersReducedMotion], revertOnUpdate: true }
  );

  return (
    <span ref={ref} className={`tabular ${className ?? ""}`}>
      {format(to)}
    </span>
  );
}
