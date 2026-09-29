/**
 * Public site URL for metadata, sitemap, robots and JSON-LD.
 *
 * Resolution chain (first non-empty wins):
 *   SiteSettings.siteUrl (DB, via getSiteUrl() in src/lib/content/site.ts)
 *   → NEXT_PUBLIC_SITE_URL
 *   → VERCEL_PROJECT_PRODUCTION_URL (set by Vercel, host only)
 *   → http://localhost:3000
 *
 * No client domain is ever hard-coded here. `||` (not `??`) so an env var
 * that exists but is empty — easy to end up with on Vercel — still falls back
 * instead of producing `new URL("")`.
 */
const LOCAL_URL = "http://localhost:3000";

export function normalizeSiteUrl(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const url = new URL(withProtocol);
    return `${url.protocol}//${url.host}`;
  } catch {
    return null;
  }
}

/** Environment part of the chain — synchronous, usable anywhere. */
export function getEnvSiteUrl(): string {
  return (
    normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL) ||
    normalizeSiteUrl(process.env.VERCEL_PROJECT_PRODUCTION_URL) ||
    LOCAL_URL
  );
}

/**
 * Environment-only site URL. TEMPORARY sync export for the pre-Modern
 * consumers (sitemap, robots, JSON-LD, metadataBase) — Phase 5 moves them to
 * getSiteUrl(), which also honours SiteSettings.siteUrl.
 */
export const siteUrl = getEnvSiteUrl();
