"use client";

import { useEffect, useRef, type RefObject } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, ScrollTrigger, requestScrollRefresh } from "@/lib/gsap";
import type { GalleryDto } from "@/lib/content/dto";
import type { SpiralHandle, SpiralSource } from "@/components/three/spiralScene";
import { useLocale } from "@/i18n/LocaleProvider";

/** Same-origin, resized source via the Next image optimizer (no CORS, sane texture size). */
const textureUrl = (src: string) => `/_next/image?url=${encodeURIComponent(src)}&w=1080&q=75`;

/** Scroll distance per photo, as a fraction of the viewport height. */
const VH_PER_PHOTO = 0.42;

interface GallerySpiralProps {
  items: GalleryDto[];
  onOpen: (index: number) => void;
  /** Invisible box placed over the front panel — the lightbox's FLIP origin. */
  focusRef: RefObject<HTMLDivElement | null>;
  handleRef: RefObject<SpiralHandle | null>;
  onFail: () => void;
}

/**
 * Desktop gallery — a spiral reel. The section pins; scroll screws the
 * helix along its track so each photograph comes round to face the viewer.
 * Accessibility never depends on WebGL: every photo is also a real button
 * (visually hidden list), and the front photo opens with click, Enter or
 * the "View photo" control.
 */
export function GallerySpiral({ items, onOpen, focusRef, handleRef, onFail }: GallerySpiralProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);
  const activeRef = useRef(0);
  const progressRef = useRef(0);
  const { t } = useLocale();
  const count = items.length;

  // Scene: fetched when the section approaches, rendered only while visible.
  useEffect(() => {
    const section = sectionRef.current;
    const canvas = canvasRef.current;
    if (!section || !canvas) return;
    let disposed = false;
    let visibility: IntersectionObserver | null = null;

    const near = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        near.disconnect();
        import("@/components/three/spiralScene")
          .then(({ createSpiral }) => {
            if (disposed) return;
            const sources: SpiralSource[] = items.map((item) => ({ url: textureUrl(item.src), width: item.width, height: item.height }));
            try {
              handleRef.current = createSpiral(canvas, sources, (index) => {
                activeRef.current = index;
                if (counterRef.current) counterRef.current.textContent = String(index + 1).padStart(2, "0");
              });
            } catch (error) {
              console.warn("[GallerySpiral] WebGL unavailable — falling back to the grid:", error);
              onFail();
              return;
            }
            handleRef.current.setTarget(progressRef.current * (count - 1));
            visibility = new IntersectionObserver(([e]) => handleRef.current?.setActive(e.isIntersecting), { threshold: 0 });
            visibility.observe(section);
          })
          .catch((error) => {
            console.warn("[GallerySpiral] failed to load:", error);
            onFail();
          });
      },
      { rootMargin: "100% 0px" }
    );
    near.observe(section);

    const onLost = (event: Event) => {
      event.preventDefault();
      onFail();
    };
    canvas.addEventListener("webglcontextlost", onLost);

    return () => {
      disposed = true;
      near.disconnect();
      visibility?.disconnect();
      canvas.removeEventListener("webglcontextlost", onLost);
      handleRef.current?.dispose();
      handleRef.current = null;
    };
  }, [items, count, handleRef, onFail]);

  // Pin: TRIGGER (section) → START (top top) → PROGRESS 0…1 = photo 1…N → END (+N×42vh).
  useGSAP(
    () => {
      const section = sectionRef.current;
      if (!section) return;
      ScrollTrigger.create({
        trigger: section,
        start: "top top",
        end: () => `+=${window.innerHeight * Math.max(1, count - 1) * VH_PER_PHOTO}`,
        pin: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          progressRef.current = self.progress;
          handleRef.current?.setTarget(self.progress * (count - 1));
        },
      });
      gsap.fromTo(".sp-chrome", { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 1, stagger: 0.08, ease: "expo.out", scrollTrigger: { trigger: section, start: "top 60%", once: true } });
      requestScrollRefresh();
    },
    { scope: sectionRef, dependencies: [count] }
  );

  const openFront = () => {
    const rect = handleRef.current?.focusRect();
    const box = focusRef.current;
    if (rect && box) Object.assign(box.style, { left: `${rect.left}px`, top: `${rect.top}px`, width: `${rect.width}px`, height: `${rect.height}px` });
    onOpen(activeRef.current);
  };

  return (
    <section
      id="gallery"
      ref={sectionRef}
      aria-label={t.gallery.eyebrow}
      className="relative h-screen overflow-hidden bg-bg"
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        handleRef.current?.setPointer(((e.clientX - r.left) / r.width) * 2 - 1, -(((e.clientY - r.top) / r.height) * 2 - 1));
      }}
      onPointerLeave={() => handleRef.current?.setPointer(0, 0)}
    >
      {/* Soft pool of light behind the reel. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_55%_45%_at_50%_52%,rgb(217_169_78/0.08),transparent_70%)]" />

      <canvas ref={canvasRef} aria-hidden="true" data-cursor="view" onClick={openFront} className="absolute inset-0 h-full w-full cursor-pointer" />
      <div ref={focusRef} aria-hidden="true" className="pointer-events-none absolute" />

      <div className="container-edit pointer-events-none relative flex h-full flex-col justify-between pb-10 pt-28">
        <div className="sp-chrome flex items-end justify-between gap-8">
          <div>
            <span className="eyebrow">{t.gallery.eyebrow}</span>
            <h2 className="mt-4 font-display uppercase leading-[0.95] tracking-tight" style={{ fontSize: "var(--font-size-h2)" }}>
              {t.gallery.heading}
            </h2>
          </div>
        </div>

        <div className="sp-chrome flex items-end justify-between gap-8">
          <p className="flex items-baseline gap-3 font-display">
            <span ref={counterRef} className="tabular text-5xl leading-none text-fg">
              01
            </span>
            <span className="tabular text-sm text-fg-muted">/ {String(count).padStart(2, "0")}</span>
          </p>
          <div className="pointer-events-auto flex items-center gap-8">
            <span className="hidden text-[10px] uppercase tracking-[0.3em] text-fg-muted lg:inline">{t.gallery.spin}</span>
            <button type="button" onClick={openFront} className="group flex min-h-11 items-center gap-3 text-xs uppercase tracking-[0.25em] text-accent">
              <span className="text-roll" data-text={t.gallery.open}>
                <span>{t.gallery.open}</span>
              </span>
              <span aria-hidden="true" className="transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:translate-x-1.5">
                →
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Every photo stays reachable without WebGL or a mouse. */}
      <ul className="sr-only">
        {items.map((item, i) => (
          <li key={item.id}>
            <button type="button" onClick={() => onOpen(i)}>
              {t.gallery.view}: {item.alt} ({i + 1} / {count})
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
