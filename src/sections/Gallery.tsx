"use client";

import Image from "next/image";
import { useCallback, useMemo, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";
import type { GalleryDto } from "@/lib/content/dto";
import { Reveal } from "@/components/Reveal";
import { Lightbox, type LightboxItem } from "@/components/Lightbox";
import { GallerySpiral } from "@/components/gallery/GallerySpiral";
import type { SpiralHandle } from "@/components/three/spiralScene";
import { useLocale } from "@/i18n/LocaleProvider";
import { useMotionProfile } from "@/hooks/useMotionProfile";

/** Touch, small screens, reduced motion — or if WebGL fails: a calm DOM masonry. */
function GalleryGrid({ items, onOpen, reduced }: { items: GalleryDto[]; onOpen: (index: number) => void; reduced: boolean }) {
  const ref = useRef<HTMLElement>(null);
  const { t } = useLocale();

  useGSAP(
    () => {
      if (!ref.current || reduced) return;
      gsap.utils.toArray<HTMLElement>(".gl-item", ref.current).forEach((el, i) => {
        gsap.fromTo(el, { clipPath: "inset(12% 12% 12% 12%)", autoAlpha: 0 }, {
          clipPath: "inset(0% 0% 0% 0%)", autoAlpha: 1, duration: 1.2, delay: (i % 3) * 0.08, ease: "expo.out",
          scrollTrigger: { trigger: el, start: "top 90%", once: true },
        });
      });
    },
    { scope: ref, dependencies: [reduced, items.length], revertOnUpdate: true }
  );

  return (
    <section id="gallery" ref={ref} aria-label={t.gallery.eyebrow} className="relative py-[var(--section-padding-y)]">
      <div className="container-edit">
        <Reveal className="mb-16 flex items-end justify-between gap-8">
          <div>
            <span className="eyebrow">{t.gallery.eyebrow}</span>
            <h2 className="mt-4 font-display uppercase leading-[0.95] tracking-tight" style={{ fontSize: "var(--font-size-h2)" }}>
              {t.gallery.heading}
            </h2>
          </div>
          <span className="eyebrow tabular hidden md:block">{String(items.length).padStart(2, "0")}</span>
        </Reveal>

        <div className="columns-2 gap-3 md:columns-3 md:gap-5">
          {items.map((item, i) => (
            <button
              key={item.id}
              data-gallery-index={i}
              onClick={() => onOpen(i)}
              className="gl-item group relative mb-3 block w-full break-inside-avoid md:mb-5"
              aria-label={`${t.gallery.view}: ${item.alt}`}
              data-cursor="view"
            >
              <span className="gl-media relative block overflow-hidden">
                <Image
                  src={item.src}
                  alt={item.alt}
                  width={item.width}
                  height={item.height}
                  sizes="(min-width: 768px) 33vw, 50vw"
                  className="w-full object-cover brightness-[0.82] transition-[transform,filter] duration-[1200ms] ease-[var(--ease-out-expo)] group-hover:scale-[1.045] group-hover:brightness-100 group-focus-visible:brightness-100"
                  loading="lazy"
                />
              </span>
              <span className="pointer-events-none absolute bottom-3 left-3 flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] text-fg opacity-0 transition-[opacity,transform] duration-500 group-hover:opacity-100 md:translate-y-2 md:group-hover:translate-y-0">
                <span className="tabular">{String(i + 1).padStart(2, "0")}</span>
                {item.caption && <span className="hidden md:inline">— {item.caption}</span>}
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * "Frames from the road". Desktop with a fine pointer: a spiral reel
 * (WebGL) the visitor screws through by scrolling. Everywhere else — and
 * whenever WebGL is unavailable — the DOM masonry. One lightbox for both.
 */
export function Gallery({ items }: { items: GalleryDto[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [spiralFailed, setSpiralFailed] = useState(false);
  const { desktop, hover, reduced } = useMotionProfile();
  const focusRef = useRef<HTMLDivElement>(null);
  const spiralRef = useRef<SpiralHandle | null>(null);
  const useSpiral = desktop && hover && !spiralFailed && items.length >= 3;

  const onSpiralFail = useCallback(() => setSpiralFailed(true), []);

  const lightboxItems = useMemo<LightboxItem[]>(
    () => items.map((item) => ({ src: item.src, alt: item.alt, caption: item.caption ?? undefined, width: item.width, height: item.height })),
    [items]
  );

  // FLIP origin: the grid thumbnail, or — in the spiral — the front panel's
  // projected rect (only valid for the photo that is facing the viewer).
  const getThumb = useCallback(
    (index: number) => {
      if (useSpiral) {
        const rect = spiralRef.current?.focusRect();
        const box = focusRef.current;
        if (rect && box) Object.assign(box.style, { left: `${rect.left}px`, top: `${rect.top}px`, width: `${rect.width}px`, height: `${rect.height}px` });
        return box;
      }
      return document.querySelector<HTMLElement>(`#gallery [data-gallery-index="${index}"] .gl-media`);
    },
    [useSpiral]
  );

  if (items.length === 0) return null;

  return (
    <>
      {useSpiral ? (
        <GallerySpiral items={items} onOpen={setActiveIndex} focusRef={focusRef} handleRef={spiralRef} onFail={onSpiralFail} />
      ) : (
        <GalleryGrid items={items} onOpen={setActiveIndex} reduced={reduced} />
      )}

      {activeIndex !== null && (
        <Lightbox
          items={lightboxItems}
          index={activeIndex}
          onClose={() => setActiveIndex(null)}
          onIndexChange={setActiveIndex}
          getThumb={getThumb}
        />
      )}
    </>
  );
}
