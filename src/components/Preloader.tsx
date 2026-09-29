"use client";

import { useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, requestScrollRefresh } from "@/lib/gsap";
import { useAppReady } from "@/hooks/useAppReady";
import { useLocale } from "@/i18n/LocaleProvider";
import { lockScroll, rememberScrollPosition, restoreScrollPosition } from "@/lib/lenisStore";
import { Vinyl } from "@/components/Vinyl";

const SESSION_KEY = "as-preloader-seen";
/** First visit: the intro is on screen at least this long (from navigation start), even on a warm cache. */
const MIN_DURATION_MS = 3200;
/** The disc/label/AS/spin sequence always gets to finish, however late hydration lands. */
const MIN_INTRO_MS = 1900;
/** Hard cap from navigation start — nothing may keep the visitor behind the loader longer. */
const MAX_WAIT_MS = 5000;
/** How long the Hero image alone may extend the intro. */
const HERO_IMAGE_WAIT_MS = 2500;
/** Label radius / disc radius in the Vinyl SVG (66 / 200). */
const LABEL_RATIO = 0.33;

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** Only what the first frame after the loader needs: webfonts + the Hero's LCP image, decoded. */
function criticalAssetsReady(): Promise<void> {
  const fonts = "fonts" in document ? document.fonts.ready.then(() => undefined) : Promise.resolve();

  // Poll `complete` every frame instead of trusting a single load event: the
  // <img> can finish (or be swapped by React/next/image) before listeners are
  // attached, which left this promise pending forever and held the loader
  // until the hard cap. Capped separately — never hold visitors on one image.
  const image = new Promise<void>((resolve) => {
    const started = performance.now();
    const check = () => {
      const img = document.querySelector<HTMLImageElement>("#top img");
      if (!img || (img.complete && img.naturalWidth > 0) || performance.now() - started > HERO_IMAGE_WAIT_MS) {
        resolve();
        return;
      }
      requestAnimationFrame(check);
    };
    check();
  });

  return Promise.all([fonts, image]).then(() => undefined);
}

/**
 * "Vinyl AS" intro. duration = max(3.2s, critical assets) on the first visit
 * of a session; later reloads in the same session get a ~1s version of the
 * same gesture. Exit: the record spins up, scales, and its bronze label
 * turns into a circular window (a CSS mask hole) that opens onto the Hero.
 *
 * Everything here is SVG + CSS — no raster, so it can never become the LCP
 * element; the Hero's real <Image priority> keeps painting underneath.
 */
export function Preloader() {
  const { setReady } = useAppReady();
  const { t } = useLocale();
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);
  const [isDone, setIsDone] = useState(false);

  useGSAP(
    (_, contextSafe) => {
      const root = rootRef.current;
      const stage = stageRef.current;
      if (!root || !stage || !contextSafe) return;

      // The CSS fail-safe (globals.css) already hid the loader because JS took
      // too long to arrive — don't bring it back, just hand over to the page.
      if (getComputedStyle(root).visibility === "hidden") {
        setReady();
        setIsDone(true);
        return;
      }
      // JS is in control now — switch the CSS fail-safe off.
      root.style.animation = "none";

      let cancelled = false;
      const startedAt = performance.now();
      rememberScrollPosition();
      let isReturningVisit = false;
      try {
        isReturningVisit = sessionStorage.getItem(SESSION_KEY) === "1";
      } catch {
        // Storage blocked (privacy settings, embedded browsers) — treat as a first visit.
      }
      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      // performance.now() counts from navigation start — i.e. from when the
      // server-rendered loader first appeared — not from hydration.
      const holdMs = isReturningVisit ? 700 : Math.max(MIN_INTRO_MS, MIN_DURATION_MS - startedAt);

      lockScroll(true);

      const counter = { value: 0 };
      const renderCounter = () => {
        if (counterRef.current) counterRef.current.textContent = String(Math.round(counter.value)).padStart(2, "0");
      };

      const finish = () => {
        if (cancelled) return;
        try {
          sessionStorage.setItem(SESSION_KEY, "1");
        } catch {
          // Storage blocked — the next visit simply gets the full intro again.
        }
        lockScroll(false);
        setIsDone(true);
        requestScrollRefresh();
        // Safety net if the exit never reached the mask (no-op once consumed).
        restoreScrollPosition();
      };

      // Continuous 33⅓-ish spin; its timeScale is what "accelerates" on exit.
      const spin = gsap.to(".vinyl-spin", { rotation: 360, transformOrigin: "50% 50%", duration: 1.8, ease: "none", repeat: -1, paused: true });

      /* ---------------- Intro ---------------- */
      const intro = gsap.timeline();
      if (prefersReducedMotion) {
        gsap.set(".pl-disc", { clipPath: "circle(50% at 50% 50%)" });
        gsap.set(".pl-counter", { autoAlpha: 1 });
      } else if (isReturningVisit) {
        gsap.set(".pl-disc", { clipPath: "circle(50% at 50% 50%)" });
        intro.fromTo(stage, { autoAlpha: 0, scale: 0.94 }, { autoAlpha: 1, scale: 1, duration: 0.35, ease: "power2.out" });
        spin.play();
      } else {
        gsap.set(".vinyl-label", { scale: 0, autoAlpha: 0, transformOrigin: "50% 50%" });
        gsap.set(".vinyl-mark", { autoAlpha: 0 });
        intro
          // 200ms — a single point of light
          .fromTo(".pl-dot", { scale: 0, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.3, ease: "power2.out" }, 0.2)
          // 400ms → 800ms — radial reveal forms the record
          .fromTo(
            ".pl-disc",
            { clipPath: "circle(0% at 50% 50%)" },
            { clipPath: "circle(50% at 50% 50%)", duration: 0.55, ease: "power3.inOut" },
            0.4
          )
          .to(".pl-dot", { autoAlpha: 0, scale: 0.4, duration: 0.3, ease: "power2.in" }, 0.55)
          // 1000ms — bronze label
          .to(".vinyl-label", { scale: 1, autoAlpha: 1, duration: 0.6, ease: "expo.out" }, 1.0)
          // 1200ms — AS
          .fromTo(".vinyl-mark", { autoAlpha: 0, y: 6 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: "power3.out" }, 1.2)
          // 1400ms — the record starts turning, easing up to speed
          .add(() => {
            spin.timeScale(0).play();
            gsap.to(spin, { timeScale: 1, duration: 0.9, ease: "power2.inOut" });
          }, 1.4)
          // 1600ms — counter gains presence
          .fromTo(".pl-counter", { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: "power2.out" }, 1.6);
      }

      /* ---------------- Counter ---------------- */
      // Climbs to 96 over the hold window; the last 4% only lands once assets are ready.
      const counterTween = isReturningVisit
        ? null
        : gsap.to(counter, { value: 96, duration: (holdMs - 250) / 1000, ease: "power2.inOut", onUpdate: renderCounter });

      /* ---------------- Exit ---------------- */
      const exit = contextSafe(() => {
        if (cancelled) return;

        if (prefersReducedMotion) {
          setReady();
          restoreScrollPosition();
          gsap.to(root, { autoAlpha: 0, duration: 0.4, ease: "power1.out", onComplete: finish });
          return;
        }

        const rect = stage.getBoundingClientRect();
        const labelRadius = (rect.width / 2) * LABEL_RATIO;
        const coverRadius = Math.hypot(window.innerWidth, window.innerHeight) / 2 + 2;
        const endScale = coverRadius / labelRadius;
        const proxy = { s: 1 };

        const tl = gsap.timeline({ onComplete: finish });
        tl.to(".pl-counter", { autoAlpha: 0, y: -8, duration: 0.3, ease: "power2.in" }, 0)
          // spin accelerates + slight push-in
          .to(spin, { timeScale: 3.2, duration: 0.5, ease: "power2.in" }, 0)
          .to(proxy, {
            s: 1.14,
            duration: 0.5,
            ease: "power2.inOut",
            onUpdate: () => gsap.set(stage, { scale: proxy.s }),
          }, 0)
          // the label becomes the window: hole radius == label radius × scale
          .add(() => {
            setReady();
            // Refresh mid-page: the opening mask reveals where the visitor was.
            restoreScrollPosition();
          }, 0.45)
          .to(proxy, {
            s: endScale,
            duration: 1.05,
            ease: "power3.inOut",
            onUpdate: () => {
              const scale = proxy.s;
              root.style.setProperty("--hole", `${labelRadius * scale}px`);
              // Past ~3.5× the disc is only a blur of grooves — fade it and stop
              // scaling so the browser never rasterises a huge SVG layer.
              const fade = gsap.utils.clamp(0, 1, (scale - 1.14) / 2.4);
              gsap.set(stage, { scale: Math.min(scale, 3.6), autoAlpha: 1 - fade });
            },
          }, 0.45);
      });

      const deadline = Promise.race([criticalAssetsReady(), wait(Math.max(0, MAX_WAIT_MS - performance.now()))]);
      Promise.all([wait(holdMs - 250), deadline]).then(
        contextSafe(() => {
          if (cancelled) return;
          const elapsed = performance.now() - startedAt;
          // Never exit before the minimum, even if the promise math drifted.
          const holdFor = Math.max(0, (holdMs - elapsed) / 1000);
          counterTween?.kill();
          gsap.to(counter, {
            value: 100,
            duration: Math.max(0.25, holdFor),
            ease: "power1.out",
            onUpdate: renderCounter,
            onComplete: exit,
          });
        })
      );

      return () => {
        cancelled = true;
        spin.kill();
        lockScroll(false);
      };
    },
    { scope: rootRef }
  );

  if (isDone) return null;

  return (
    <div
      ref={rootRef}
      className="preloader-root preloader-mask fixed inset-0 z-[var(--z-preloader)] flex items-center justify-center bg-[#050505] text-fg"
      role="status"
      aria-live="polite"
      aria-label={t.loading}
    >
      <noscript>
        <style>{".preloader-root{display:none!important}"}</style>
      </noscript>
      {/* The disc must sit exactly at viewport centre — the mask hole opens from there. */}
      <div className="relative">
        <div ref={stageRef} className="relative size-[min(62vw,44svh,380px)] will-change-transform">
          <span className="pl-dot invisible absolute left-1/2 top-1/2 -ml-1 -mt-1 size-2 rounded-full bg-fg" />
          <div className="pl-disc absolute inset-0" style={{ clipPath: "circle(0% at 50% 50%)" }}>
            <Vinyl className="h-full w-full" />
          </div>
        </div>
        <div className="pl-counter invisible absolute left-1/2 top-full mt-10 flex -translate-x-1/2 items-baseline gap-3 text-[11px] uppercase tracking-[0.4em] text-fg-muted">
          <span ref={counterRef} className="tabular font-display text-fg">
            00
          </span>
          <span aria-hidden="true">/ 100</span>
        </div>
      </div>
    </div>
  );
}
