import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
  // Dev-only handle for browser QA scripts (inspect triggers/pins); stripped from production.
  if (process.env.NODE_ENV === "development") (window as unknown as { __ST?: typeof ScrollTrigger }).__ST = ScrollTrigger;
}

/** Shared motion timings — keep in sync with the CSS tokens in globals.css. */
export const motion = {
  duration: {
    fast: 0.25,
    normal: 0.55,
    slow: 0.95,
    cinematic: 1.7,
  },
  ease: {
    outExpo: "expo.out",
    cinematic: "power4.inOut",
    inOutQuart: "power4.inOut",
  },
} as const;

/** Orders triggers by their element's position in the document (pins above others must refresh first). */
function byDocumentOrder(a: ScrollTrigger, b: ScrollTrigger) {
  const ta = a.trigger;
  const tb = b.trigger;
  if (!ta || !tb || ta === tb) return 0;
  return ta.compareDocumentPosition(tb) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
}

let refreshFrame = 0;

/**
 * Sections create their ScrollTriggers at different times (desktop variants
 * only mount after hydration, the Story/WorldStages pins after media queries
 * resolve). A pin created late would otherwise leave every trigger below it
 * measured without its spacer — so any section that creates a pin calls
 * this; it batches to one sort + refresh per frame.
 */
export function requestScrollRefresh() {
  if (typeof window === "undefined") return;
  cancelAnimationFrame(refreshFrame);
  refreshFrame = requestAnimationFrame(() => {
    ScrollTrigger.sort(byDocumentOrder);
    ScrollTrigger.refresh();
  });
}

export { gsap, ScrollTrigger };
