"use client";

import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { gsap } from "@/lib/gsap";
import type { GlobeData } from "@/components/three/globeScene";
import { PLACES, type Chapter, type MapView, type PlaceKey } from "@/i18n/story";
import type { Locale } from "@/i18n/dictionary";

/**
 * The Story's geography layer — "visual language, not Google Maps".
 * One SVG, equirectangular projection (x = lon, y = −lat, ×10), fed by the
 * same pre-baked geometry as the globe (public/geo/globe.json). Chapters move
 * the camera by tweening the viewBox and draw their routes with
 * stroke-dashoffset. Stroke widths/radii are compensated with --u (user
 * units per CSS pixel) so hairlines stay hairlines at every zoom level.
 */

const K = 10;
const project = (lat: number, lon: number): [number, number] => [(lon + 180) * K, (90 - lat) * K];

/** Camera frames: centre [lat, lon] + width in degrees (height follows a 5:4 frame). */
const VIEWS: Record<MapView, { center: [number, number]; width: number }> = {
  alfenas: { center: [-21.5, -45.6], width: 5.5 },
  minas: { center: [-19.2, -45.2], width: 15 },
  southeast: { center: [-21.8, -46.2], width: 11 },
  brazil: { center: [-14.5, -52], width: 46 },
  world: { center: [18, -8], width: 150 },
};

function viewBoxOf(view: MapView) {
  const { center, width } = VIEWS[view];
  const w = width * K;
  const h = w * 0.8;
  const [cx, cy] = project(center[0], center[1]);
  return `${cx - w / 2} ${cy - h / 2} ${w} ${h}`;
}

const ringsToPath = (rings: number[][]) =>
  rings
    .map((ring) => {
      let d = "";
      for (let i = 0; i < ring.length; i += 2) {
        const [x, y] = project(ring[i + 1], ring[i]);
        d += `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
      }
      return `${d}Z`;
    })
    .join("");

function routePath(from: PlaceKey, to: PlaceKey) {
  const [x1, y1] = project(...PLACES[from].at);
  const [x2, y2] = project(...PLACES[to].at);
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  // Lift the curve perpendicular to its chord — reads as a flight path.
  const lift = Math.min(len * 0.28, 900);
  // Perpendicular (dy, −dx): bulges "north-west" for eastbound routes.
  const mx = (x1 + x2) / 2 + (dy / len) * lift;
  const my = (y1 + y2) / 2 - (dx / len) * lift;
  return `M${x1} ${y1} Q${mx} ${my} ${x2} ${y2}`;
}

const lastView = (chapter?: Chapter): MapView => {
  const view = chapter?.geo.view ?? "alfenas";
  return Array.isArray(view) ? view[view.length - 1] : view;
};

let dataPromise: Promise<GlobeData> | null = null;
const loadData = () => (dataPromise ??= fetch("/geo/globe.json").then((r) => r.json() as Promise<GlobeData>));

export interface StoryMapHandle {
  /** Moves the map to chapter `index` (in `chapters`), animated unless `immediate`. */
  goTo: (index: number, immediate?: boolean) => void;
}

interface StoryMapProps {
  chapters: Chapter[];
  locale: Locale;
  handleRef?: RefObject<StoryMapHandle | null>;
  /** Static render for a single chapter (mobile / reduced motion). */
  staticIndex?: number;
  className?: string;
}

export function StoryMap({ chapters, locale, handleRef, staticIndex, className }: StoryMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [data, setData] = useState<GlobeData | null>(null);
  const currentRef = useRef(-1);
  const pendingRef = useRef<number | null>(staticIndex ?? null);

  useEffect(() => {
    let alive = true;
    loadData()
      .then((d) => alive && setData(d))
      .catch(() => undefined); // Map is decorative — the story reads fine without it.
    return () => {
      alive = false;
    };
  }, []);

  const paths = useMemo(
    () => (data ? { coast: ringsToPath(data.coast), brazil: ringsToPath(data.brazil), mg: ringsToPath(data.mg) } : null),
    [data]
  );

  // Which chapter introduces each place (points appear from then on).
  const introducedAt = useMemo(() => {
    const at: Partial<Record<PlaceKey, number>> = {};
    chapters.forEach((c, i) => {
      [...(c.geo.labels ?? []), ...(c.geo.route ?? []), ...(c.geo.pulse ? [c.geo.pulse] : [])].forEach((p) => {
        if (at[p] === undefined) at[p] = i;
      });
    });
    return at;
  }, [chapters]);

  const routes = useMemo(
    () => chapters.flatMap((c, i) => (c.geo.route ? [{ index: i, d: routePath(c.geo.route[0], c.geo.route[1]) }] : [])),
    [chapters]
  );
  const ringsIndex = chapters.findIndex((c) => c.geo.rings);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || !paths) return;

    /** --u = SVG user units per CSS pixel for the current viewBox (slice fit). */
    const updateUnit = () => {
      const vb = svg.viewBox.baseVal;
      const cw = svg.clientWidth || 1;
      const ch = svg.clientHeight || 1;
      svg.style.setProperty("--u", String(Math.min(vb.width / cw, vb.height / ch)));
    };

    const goTo = (index: number, immediate = false) => {
      const chapter = chapters[index];
      if (!chapter) return;
      const prev = currentRef.current;
      currentRef.current = index;
      const views = Array.isArray(chapter.geo.view) ? chapter.geo.view : [chapter.geo.view];
      const d = immediate ? 0 : 1;

      gsap.killTweensOf(svg);
      if (immediate) {
        svg.setAttribute("viewBox", viewBoxOf(views[views.length - 1]));
        updateUnit();
      } else {
        // Multi-step views (Brazil → Minas → Alfenas) only play when moving forward.
        const sequence = index > prev ? views : [views[views.length - 1]];
        const tl = gsap.timeline();
        sequence.forEach((view) => {
          tl.to(svg, { attr: { viewBox: viewBoxOf(view) }, duration: 1.5 / Math.max(1, sequence.length - 0.4), ease: "power3.inOut", onUpdate: updateUnit });
        });
      }

      // Routes: past = settled & dim, current = drawing & bright, future = hidden.
      svg.querySelectorAll<SVGPathElement>("[data-route]").forEach((path) => {
        const at = Number(path.dataset.route);
        gsap.killTweensOf(path);
        if (at < index) gsap.to(path, { strokeDashoffset: 0, opacity: 0.35, duration: 0.6 * d });
        else if (at === index) {
          gsap.fromTo(path, { strokeDashoffset: 1, opacity: 1 }, { strokeDashoffset: 0, duration: 1.8 * d, delay: 0.5 * d, ease: "power2.inOut" });
        } else gsap.to(path, { strokeDashoffset: 1, opacity: 0, duration: 0.4 * d });
      });

      svg.querySelectorAll<SVGGElement>("[data-place]").forEach((g) => {
        const key = g.dataset.place as PlaceKey;
        const visible = (introducedAt[key] ?? Infinity) <= index;
        const labelled = chapter.geo.labels?.includes(key) ?? false;
        g.toggleAttribute("data-pulse", chapter.geo.pulse === key);
        gsap.to(g, { opacity: visible ? 1 : 0, duration: 0.5 * d });
        gsap.to(g.querySelector("text"), { opacity: labelled ? 1 : 0, duration: 0.5 * d, delay: labelled ? 0.6 * d : 0 });
      });

      const rings = svg.querySelector<SVGGElement>("[data-rings]");
      if (rings) {
        const on = index === ringsIndex;
        gsap.to(rings, { opacity: on ? 1 : 0, duration: 0.6 * d });
        if (on && !immediate) {
          gsap.fromTo(rings.querySelectorAll("circle"), { attr: { r: 0 } }, {
            attr: { r: (i: number) => [60, 120, 190][i] }, duration: 1.8, stagger: 0.25, ease: "power2.out", delay: 0.5,
          });
        }
      }
    };

    if (handleRef) handleRef.current = { goTo };
    const onResize = () => updateUnit();
    window.addEventListener("resize", onResize);
    const initial = pendingRef.current ?? Math.max(0, currentRef.current);
    currentRef.current = -1;
    goTo(initial, true);

    return () => {
      window.removeEventListener("resize", onResize);
      if (handleRef) handleRef.current = null;
    };
  }, [paths, chapters, handleRef, introducedAt, ringsIndex]);

  // Before the geometry arrives, remember where the parent wants to be.
  useEffect(() => {
    if (!handleRef || paths) return;
    handleRef.current = {
      goTo: (index) => {
        pendingRef.current = index;
      },
    };
  }, [handleRef, paths]);

  const [ax, ay] = project(...PLACES.alfenas.at);

  return (
    <svg
      ref={svgRef}
      aria-hidden="true"
      viewBox={viewBoxOf(lastView(chapters[staticIndex ?? 0]))}
      preserveAspectRatio="xMidYMid slice"
      className={`story-map ${className ?? ""}`}
      style={{ ["--u" as string]: "1" }}
    >
      {paths && (
        <>
          <path d={paths.coast} className="sm-coast" />
          <path d={paths.brazil} className="sm-brazil" />
          <path d={paths.mg} className="sm-mg" />

          <g data-rings="" opacity={0}>
            {[0, 1, 2].map((i) => (
              <circle key={i} cx={ax} cy={ay} r={0} className="sm-ring" />
            ))}
          </g>

          {routes.map((r) => (
            <path key={r.index} data-route={r.index} d={r.d} pathLength={1} className="sm-route" strokeDasharray="1" strokeDashoffset="1" opacity={0} />
          ))}

          {(Object.keys(PLACES) as PlaceKey[])
            .filter((key) => introducedAt[key] !== undefined)
            .map((key) => {
              const [x, y] = project(...PLACES[key].at);
              return (
                <g key={key} data-place={key} opacity={0} transform={`translate(${x} ${y})`}>
                  <circle r={1} className="sm-halo" />
                  <circle r={1} className="sm-dot" />
                  <text className="sm-label" opacity={0}>
                    {PLACES[key].name[locale]}
                  </text>
                </g>
              );
            })}
        </>
      )}
    </svg>
  );
}
