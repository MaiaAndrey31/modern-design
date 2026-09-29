"use client";

import Image from "next/image";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import { lockScroll } from "@/lib/lenisStore";
import { useLocale } from "@/i18n/LocaleProvider";

export interface LightboxItem {
  src: string;
  alt: string;
  caption?: string;
  width: number;
  height: number;
}

interface LightboxProps {
  items: LightboxItem[];
  index: number;
  onClose: () => void;
  onIndexChange: (index: number) => void;
  /** Returns the on-page thumbnail for an index — the FLIP origin/destination. */
  getThumb: (index: number) => HTMLElement | null;
}

const SWIPE_PX = 50;

/** Fits the photo's real aspect ratio inside the viewport (so FLIP never distorts). */
function fitSize(item: LightboxItem) {
  const maxW = window.innerWidth * (window.innerWidth < 768 ? 0.92 : 0.8);
  const maxH = window.innerHeight * 0.78;
  const ratio = item.width / item.height;
  let w = maxW;
  let h = w / ratio;
  if (h > maxH) {
    h = maxH;
    w = h * ratio;
  }
  return { width: Math.round(w), height: Math.round(h) };
}

/**
 * Fullscreen viewer. Opens by expanding the clicked thumbnail into place
 * (FLIP: measure → invert → play) and closes back into whichever thumbnail
 * is current. ESC / ← / → on keyboard, swipe on touch, focus trapped.
 */
export function Lightbox({ items, index, onClose, onIndexChange, getThumb }: LightboxProps) {
  const { t } = useLocale();
  const dialogRef = useRef<HTMLDivElement>(null);
  const figureRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const pointerStart = useRef<number | null>(null);
  const closingRef = useRef(false);
  const swipedRef = useRef(false);
  const [size, setSize] = useState(() => fitSize(items[index]));
  const item = items[index];
  const reduced = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const prev = useCallback(() => onIndexChange((index - 1 + items.length) % items.length), [index, items.length, onIndexChange]);
  const next = useCallback(() => onIndexChange((index + 1) % items.length), [index, items.length, onIndexChange]);

  // FLIP from the thumbnail into the fitted frame.
  useLayoutEffect(() => {
    const figure = figureRef.current;
    const backdrop = backdropRef.current;
    const thumb = getThumb(index);
    if (!figure || !backdrop) return;

    gsap.fromTo(backdrop, { opacity: 0 }, { opacity: 1, duration: reduced ? 0.2 : 0.5, ease: "power2.out" });
    gsap.fromTo(".lb-chrome", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5, delay: reduced ? 0 : 0.35 });
    if (!thumb || reduced) return;

    const from = thumb.getBoundingClientRect();
    const to = figure.getBoundingClientRect();
    gsap.fromTo(
      figure,
      {
        x: from.left + from.width / 2 - (to.left + to.width / 2),
        y: from.top + from.height / 2 - (to.top + to.height / 2),
        scaleX: from.width / to.width,
        scaleY: from.height / to.height,
      },
      { x: 0, y: 0, scaleX: 1, scaleY: 1, duration: 0.8, ease: "expo.out" }
    );
    // Opening only — later index changes animate differently.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const close = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    const figure = figureRef.current;
    const thumb = getThumb(index);
    const tl = gsap.timeline({ onComplete: onClose });
    tl.to(".lb-chrome", { autoAlpha: 0, duration: 0.2 }, 0).to(backdropRef.current, { opacity: 0, duration: 0.5, ease: "power2.inOut" }, 0.05);
    if (figure && thumb && !reduced) {
      const from = figure.getBoundingClientRect();
      const to = thumb.getBoundingClientRect();
      tl.to(
        figure,
        {
          x: `+=${to.left + to.width / 2 - (from.left + from.width / 2)}`,
          y: `+=${to.top + to.height / 2 - (from.top + from.height / 2)}`,
          scaleX: to.width / from.width,
          scaleY: to.height / from.height,
          duration: 0.6,
          ease: "power3.inOut",
        },
        0
      );
    } else if (figure) {
      tl.to(figure, { opacity: 0, duration: 0.25 }, 0);
    }
  }, [getThumb, index, onClose, reduced]);

  // Index change: refit and cross-slide.
  const lastIndex = useRef(index);
  useEffect(() => {
    if (lastIndex.current === index) return;
    const dir = index > lastIndex.current ? 1 : -1;
    lastIndex.current = index;
    setSize(fitSize(items[index]));
    if (!reduced && figureRef.current) {
      gsap.fromTo(figureRef.current, { opacity: 0, x: 40 * dir }, { opacity: 1, x: 0, duration: 0.6, ease: "expo.out" });
    }
  }, [index, items, reduced]);

  useEffect(() => {
    previouslyFocused.current = document.activeElement as HTMLElement;
    dialogRef.current?.focus();
    lockScroll(true);
    const onResize = () => setSize(fitSize(items[lastIndex.current]));
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      lockScroll(false);
      previouslyFocused.current?.focus();
    };
  }, [items]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
      if (event.key === "ArrowRight") next();
      if (event.key === "ArrowLeft") prev();
      if (event.key === "Tab") {
        const focusable = dialogRef.current?.querySelectorAll<HTMLElement>("button");
        if (!focusable || focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [close, next, prev]);

  if (!item) return null;

  const counter = `${String(index + 1).padStart(2, "0")} / ${String(items.length).padStart(2, "0")}`;
  const controlCls =
    "lb-chrome invisible flex min-h-11 min-w-11 items-center justify-center text-xs uppercase tracking-[0.25em] text-fg-muted transition-colors hover:text-fg";

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={item.alt}
      tabIndex={-1}
      className="fixed inset-0 z-[var(--z-lightbox)] flex items-center justify-center outline-none"
      onPointerDown={(e) => {
        pointerStart.current = e.clientX;
        swipedRef.current = false;
      }}
      onPointerUp={(e) => {
        if (pointerStart.current === null) return;
        const dx = e.clientX - pointerStart.current;
        pointerStart.current = null;
        if (Math.abs(dx) > SWIPE_PX) {
          swipedRef.current = true;
          (dx < 0 ? next : prev)();
        }
      }}
    >
      <div ref={backdropRef} className="absolute inset-0 bg-bg/95 backdrop-blur-sm" onClick={() => !swipedRef.current && close()} />

      <div ref={figureRef} className="relative will-change-transform" style={{ width: size.width, height: size.height }}>
        <Image src={item.src} alt={item.alt} fill sizes="90vw" className="select-none object-contain" draggable={false} priority />
      </div>

      <div className="lb-chrome invisible absolute left-[var(--gutter)] top-6 flex items-center gap-6 text-[10px] uppercase tracking-[0.3em] text-fg-muted">
        <span className="tabular text-fg">{counter}</span>
        {item.caption && <span className="hidden md:inline">{item.caption}</span>}
      </div>

      <button onClick={close} className={`${controlCls} absolute right-[calc(var(--gutter)-0.75rem)] top-4 px-3`}>
        {t.gallery.close} <span className="ml-2 hidden md:inline">(Esc)</span>
      </button>

      {items.length > 1 && (
        <>
          <button onClick={prev} aria-label={t.gallery.prev} className={`${controlCls} absolute bottom-6 left-[var(--gutter)] md:bottom-auto md:top-1/2 md:-translate-y-1/2`}>
            ←
          </button>
          <button onClick={next} aria-label={t.gallery.next} className={`${controlCls} absolute bottom-6 right-[var(--gutter)] md:bottom-auto md:top-1/2 md:-translate-y-1/2`}>
            →
          </button>
        </>
      )}
    </div>
  );
}
