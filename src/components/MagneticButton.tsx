"use client";

import { useRef, type ReactNode } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";
import { useMediaQuery } from "@/hooks/useMediaQuery";

interface MagneticButtonProps {
  children: ReactNode;
  className?: string;
  strength?: number;
  cursorVariant?: "view" | "play" | "drag" | "go" | "open";
}

/** Wraps its child in a subtle magnetic-pull hover effect. Desktop (fine pointer) only. */
export function MagneticButton({ children, className, strength = 0.25, cursorVariant }: MagneticButtonProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isFinePointer = useMediaQuery("(hover: hover) and (pointer: fine)");

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || !isFinePointer || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      const quickX = gsap.quickTo(el, "x", { duration: 0.5, ease: "power3.out" });
      const quickY = gsap.quickTo(el, "y", { duration: 0.5, ease: "power3.out" });

      // Measured once per hover, not per pointermove (avoids forced layout on every event).
      let rect = el.getBoundingClientRect();
      const handleEnter = () => {
        rect = el.getBoundingClientRect();
      };

      const handleMove = (event: PointerEvent) => {
        const relX = event.clientX - (rect.left + rect.width / 2);
        const relY = event.clientY - (rect.top + rect.height / 2);
        quickX(relX * strength);
        quickY(relY * strength);
      };

      const handleLeave = () => {
        quickX(0);
        quickY(0);
      };

      el.addEventListener("pointerenter", handleEnter);
      el.addEventListener("pointermove", handleMove);
      el.addEventListener("pointerleave", handleLeave);
      return () => {
        el.removeEventListener("pointerenter", handleEnter);
        el.removeEventListener("pointermove", handleMove);
        el.removeEventListener("pointerleave", handleLeave);
      };
    },
    { scope: ref, dependencies: [isFinePointer, strength] }
  );

  return (
    <div ref={ref} className={className} data-cursor={cursorVariant}>
      {children}
    </div>
  );
}
