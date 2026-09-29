"use client";

import { useRef, type CSSProperties, type ReactNode } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

interface RevealProps {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  start?: string;
  style?: CSSProperties;
}

/** Scroll-triggered fade/rise-in used across sections for consistent, restrained motion. */
export function Reveal({ children, delay = 0, y = 40, className, start = "top 85%", style }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  useGSAP(
    () => {
      if (!ref.current || prefersReducedMotion) return;
      gsap.fromTo(
        ref.current,
        { autoAlpha: 0, y },
        {
          autoAlpha: 1,
          y: 0,
          duration: 1.1,
          delay,
          ease: "expo.out",
          scrollTrigger: { trigger: ref.current, start, once: true },
        }
      );
    },
    { scope: ref, dependencies: [prefersReducedMotion] }
  );

  return (
    <div ref={ref} className={className} style={prefersReducedMotion ? style : { visibility: "hidden", ...style }}>
      {children}
    </div>
  );
}
