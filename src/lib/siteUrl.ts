/**
 * Public site URL for metadata, sitemap, robots and JSON-LD.
 * `||` (not `??`) so an env var that exists but is empty — easy to end up with
 * on Vercel — still falls back instead of producing `new URL("")`.
 */
export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://alansaher.com").replace(/\/+$/, "");
