import type Lenis from "lenis";

let activeLenis: Lenis | null = null;
let isLocked = false;

export function setActiveLenis(instance: Lenis | null) {
  activeLenis = instance;
  if (instance && isLocked) instance.stop();
}

export function getActiveLenis() {
  return activeLenis;
}

/**
 * Locks page scroll (preloader, lightbox, mobile menu). Uses Lenis' own
 * stop/start when smooth scroll is active; `overflow: hidden` is only the
 * native-scroll fallback — `scrollbar-gutter: stable` in globals.css keeps
 * the layout from shifting when the scrollbar disappears.
 */
export function lockScroll(locked: boolean) {
  isLocked = locked;
  if (activeLenis) {
    if (locked) activeLenis.stop();
    else activeLenis.start();
  }
  document.documentElement.style.overflow = locked ? "hidden" : "";
}

/** Scrolls to a section by id, using the shared Lenis instance when smooth scroll is active. */
export function scrollToSection(id: string, offset = 0) {
  const target = document.getElementById(id);
  if (!target) return;

  if (activeLenis) {
    activeLenis.scrollTo(target, { offset, duration: 1.4 });
  } else {
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

/** Scrolls to an absolute Y position (used by the Story timeline's chapter dots). */
export function scrollToY(y: number) {
  if (activeLenis) activeLenis.scrollTo(y, { duration: 1.2 });
  else window.scrollTo({ top: y, behavior: "smooth" });
}

const SCROLL_KEY = "as-scroll-memory";

/**
 * Scroll memory across reloads / back-forward. The browser's own
 * restoration runs before the pinned sections exist — their spacers add
 * thousands of pixels, so a refresh mid-page landed in a different
 * section. We take over: remember the position on the way out, and
 * restore it only after the intro has finished and every pin is measured.
 */
export function rememberScrollPosition() {
  if (typeof window === "undefined") return;
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  window.addEventListener("pagehide", () => {
    try {
      sessionStorage.setItem(SCROLL_KEY, JSON.stringify({ path: location.pathname, y: window.scrollY }));
    } catch {
      // Storage blocked — the page simply opens at the top.
    }
  });
}

/** Call once pins are refreshed (after the intro). No-op on fresh navigations. */
export function restoreScrollPosition() {
  let saved: { path: string; y: number } | null = null;
  try {
    saved = JSON.parse(sessionStorage.getItem(SCROLL_KEY) ?? "null");
    sessionStorage.removeItem(SCROLL_KEY);
  } catch {
    return;
  }
  const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
  const isReturn = nav?.type === "reload" || nav?.type === "back_forward";
  // An explicit #hash in the URL wins over remembered position.
  if (!saved || !isReturn || saved.path !== location.pathname || location.hash) return;
  const y = saved.y;
  // Two frames: let the batched ScrollTrigger refresh (pin spacers) land first.
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      if (activeLenis) activeLenis.scrollTo(y, { immediate: true, force: true });
      else window.scrollTo(0, y);
    })
  );
}
