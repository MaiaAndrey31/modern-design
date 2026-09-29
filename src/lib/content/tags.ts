/** One cache tag per content type, plus a catch-all — see src/lib/content/*.ts and the admin _actions/*.ts. */
export const CACHE_TAGS = {
  all: "content",
  site: "content:site",
  seo: "content:seo",
  hero: "content:hero",
  statement: "content:statement",
  story: "content:story",
  stages: "content:stages",
  narrative: "content:narrative",
  experience: "content:experience",
  releases: "content:releases",
  gallery: "content:gallery",
  press: "content:press",
  presskit: "content:presskit",
  shows: "content:shows",
  social: "content:social",
  booking: "content:booking",
  media: "content:media",
} as const;

export type CacheTag = (typeof CACHE_TAGS)[keyof typeof CACHE_TAGS];
