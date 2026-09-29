/**
 * Minimal analytics abstraction. No external analytics service is wired up
 * yet — `track()` is the single integration point: plug in GA4, Plausible,
 * Meta Pixel, etc. here without touching call sites across the app.
 *
 * Event names used across the site (see README > "Analytics"):
 * hero_booking_click, booking_open, booking_submit, spotify_click,
 * instagram_click, press_click, show_click
 */
export type AnalyticsEvent =
  | "hero_booking_click"
  | "booking_open"
  | "booking_submit"
  | "spotify_click"
  | "instagram_click"
  | "press_click"
  | "show_click";

export function track(event: AnalyticsEvent, payload?: Record<string, unknown>) {
  if (process.env.NODE_ENV === "development") {
    console.info(`[analytics] ${event}`, payload ?? {});
  }
  // TODO: forward to the chosen analytics provider, e.g.:
  // window.gtag?.("event", event, payload);
}
