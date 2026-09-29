/**
 * Formats a `@db.Date`-sourced JS `Date` (always stored/retrieved as
 * UTC-midnight — see src/lib/content/shows.ts) for display. MUST use
 * `timeZone: "UTC"` — Intl.DateTimeFormat otherwise renders in the server's
 * local timezone, which silently shifts the displayed day by one wherever
 * that timezone is behind UTC (e.g. Brazil, UTC-3: Dec 31 UTC-midnight
 * would render as "Dec 30" without this).
 */
export function formatDateOnly(date: Date, options: Intl.DateTimeFormatOptions = { day: "2-digit", month: "short", year: "numeric" }) {
  return new Intl.DateTimeFormat("pt-BR", { ...options, timeZone: "UTC" }).format(date);
}
