"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import type { GlobeData, GlobeHandle } from "@/components/three/globeScene";

interface MinasGlobeProps {
  /** Filled once the globe is live — the parent section drives it with scroll progress. */
  handleRef: RefObject<GlobeHandle | null>;
  className?: string;
}

/**
 * Lazy shell for the Minas → World globe. three.js is only fetched when the
 * section is within ~one viewport, and never on touch/small screens,
 * reduced motion or Save-Data (the parent decides via `enabled`-style
 * mounting). Rendering pauses whenever the canvas is off-screen.
 */
export function MinasGlobe({ handleRef, className }: MinasGlobeProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isNear, setIsNear] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // 1) Wait until the section approaches before downloading three.js.
  useEffect(() => {
    const node = wrapperRef.current;
    if (!node) return;
    // Respect data-saver: the photograph alone carries the section.
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    if (connection?.saveData) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsNear(true);
          observer.disconnect();
        }
      },
      { rootMargin: "100% 0px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // 2) Build the scene; 3) run the render loop only while visible.
  useEffect(() => {
    if (!isNear || !canvasRef.current) return;
    let disposed = false;
    let handle: GlobeHandle | null = null;
    let visibility: IntersectionObserver | null = null;
    let resizeObserver: ResizeObserver | null = null;

    // Scene code and map geometry (public/geo/globe.json) load in parallel.
    Promise.all([
      import("@/components/three/globeScene"),
      fetch("/geo/globe.json").then((res) => {
        if (!res.ok) throw new Error(`globe.json ${res.status}`);
        return res.json() as Promise<GlobeData>;
      }),
    ])
      .then(([{ createMinasGlobe }, data]) => {
        if (disposed || !canvasRef.current) return;
        try {
          handle = createMinasGlobe(canvasRef.current, data);
        } catch (error) {
          // No WebGL — the section's photography carries it alone.
          console.warn("[MinasGlobe] disabled:", error);
          return;
        }
        handleRef.current = handle;
        setIsLoaded(true);

        visibility = new IntersectionObserver(([entry]) => handle?.setActive(entry.isIntersecting), { threshold: 0 });
        visibility.observe(canvasRef.current);
        resizeObserver = new ResizeObserver(() => handle?.resize());
        resizeObserver.observe(canvasRef.current);
      })
      .catch((error) => console.warn("[MinasGlobe] failed to load:", error));

    return () => {
      disposed = true;
      visibility?.disconnect();
      resizeObserver?.disconnect();
      handle?.dispose();
      handleRef.current = null;
    };
  }, [isNear, handleRef]);

  return (
    <div ref={wrapperRef} className={className} aria-hidden="true">
      <canvas
        ref={canvasRef}
        className={`h-full w-full transition-opacity duration-[1500ms] ease-out ${isLoaded ? "opacity-100" : "opacity-0"}`}
      />
    </div>
  );
}
