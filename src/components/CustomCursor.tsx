"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { useLocale } from "@/i18n/LocaleProvider";

type CursorVariant = "default" | "link" | "view" | "open" | "go" | "play" | "drag" | "text";

const LABELLED: CursorVariant[] = ["view", "open", "go", "play", "drag"];

/** Ring scale per state — the ring is 84px, so every size change is a transform. */
const RING_SCALE: Record<CursorVariant, number> = {
  default: 0.38,
  link: 0.62,
  view: 1,
  open: 1,
  go: 0.86,
  play: 1,
  drag: 1,
  text: 0,
};

/**
 * Minimal custom cursor — fine pointers only, off for touch and reduced
 * motion (the native cursor stays). The native cursor is hidden only after
 * the first pointer move has actually positioned this one, so a failure here
 * can never leave the visitor without a cursor. Elements opt into labelled
 * states with `data-cursor="view|open|go|play|drag"`; plain links/buttons
 * get a subtle grow; text fields keep the native I-beam.
 */
export function CustomCursor() {
  const isFinePointer = useMediaQuery("(hover: hover) and (pointer: fine)");
  const prefersReducedMotion = usePrefersReducedMotion();
  const { t } = useLocale();
  const followerRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const [variant, setVariant] = useState<CursorVariant>("default");
  const [visible, setVisible] = useState(false);

  const enabled = isFinePointer && !prefersReducedMotion;

  useEffect(() => {
    if (!enabled) return;
    const follower = followerRef.current;
    const dot = dotRef.current;
    if (!follower || !dot) return;

    const ring = {
      x: gsap.quickTo(follower, "x", { duration: 0.45, ease: "power3.out" }),
      y: gsap.quickTo(follower, "y", { duration: 0.45, ease: "power3.out" }),
    };
    const point = {
      x: gsap.quickTo(dot, "x", { duration: 0.08, ease: "power2.out" }),
      y: gsap.quickTo(dot, "y", { duration: 0.08, ease: "power2.out" }),
    };

    let confirmed = false;
    let isVisible = false;
    let current: CursorVariant = "default";

    const handleMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" && event.pointerType !== "pen") return;
      ring.x(event.clientX);
      ring.y(event.clientY);
      point.x(event.clientX);
      point.y(event.clientY);
      if (!confirmed) {
        confirmed = true;
        gsap.set([follower, dot], { x: event.clientX, y: event.clientY });
        document.documentElement.classList.add("has-custom-cursor");
      }
      if (!isVisible) {
        isVisible = true;
        setVisible(true);
      }
    };

    const handleOver = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      let next: CursorVariant = "default";
      if (target?.closest("input, textarea, select, [contenteditable]")) next = "text";
      else {
        const tagged = target?.closest<HTMLElement>("[data-cursor]");
        if (tagged?.dataset.cursor) next = tagged.dataset.cursor as CursorVariant;
        else if (target?.closest("a, button, [role='button'], label")) next = "link";
      }
      if (next !== current) {
        current = next;
        setVariant(next);
      }
    };

    const handleLeave = () => {
      isVisible = false;
      setVisible(false);
    };

    window.addEventListener("pointermove", handleMove, { passive: true });
    window.addEventListener("pointerover", handleOver, { passive: true });
    document.documentElement.addEventListener("pointerleave", handleLeave);

    return () => {
      document.documentElement.classList.remove("has-custom-cursor");
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerover", handleOver);
      document.documentElement.removeEventListener("pointerleave", handleLeave);
    };
  }, [enabled]);

  if (!enabled) return null;

  const labelled = LABELLED.includes(variant);
  const label = labelled ? t.cursor[variant as keyof typeof t.cursor] : "";

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[var(--z-cursor)]"
      style={{ opacity: visible ? 1 : 0, transition: "opacity 0.25s ease" }}
    >
      <div ref={followerRef} className="fixed left-0 top-0">
        <div
          className={`-ml-[42px] -mt-[42px] flex size-[84px] items-center justify-center rounded-full border transition-[transform,background-color,border-color] duration-500 ease-[var(--ease-out-expo)] ${
            labelled ? "border-transparent bg-fg" : "border-fg/35 bg-transparent"
          } ${variant === "play" ? "!bg-accent" : ""}`}
          style={{ transform: `scale(${RING_SCALE[variant]})` }}
        >
          <span
            className={`text-[10px] font-medium uppercase tracking-[0.2em] text-bg transition-opacity duration-300 ${labelled ? "opacity-100 delay-100" : "opacity-0"}`}
          >
            {label}
          </span>
        </div>
      </div>
      <div
        ref={dotRef}
        className={`fixed left-0 top-0 -ml-[3px] -mt-[3px] size-1.5 rounded-full bg-fg transition-opacity duration-200 ${
          labelled || variant === "text" ? "opacity-0" : "opacity-100"
        }`}
      />
    </div>
  );
}
