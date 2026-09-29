/** One cache tag per content type, plus a catch-all — see src/lib/content/*.ts and the admin _actions/*.ts. */
export const CACHE_TAGS = {
  all: "content",
  // global settings / identity
  site: "content:site",
  brand: "content:brand",
  theme: "content:theme",
  typography: "content:typography",
  header: "content:header",
  footer: "content:footer",
  navigation: "content:navigation",
  social: "content:social",
  seo: "content:seo",
  profile: "content:profile",
  // sections
  sections: "content:sections",
  hero: "content:hero",
  statement: "content:statement",
  story: "content:story",
  places: "content:places",
  narrative: "content:narrative",
  stages: "content:stages",
  experience: "content:experience",
  releases: "content:releases",
  gallery: "content:gallery",
  press: "content:press",
  presskit: "content:presskit",
  shows: "content:shows",
  booking: "content:booking",
  media: "content:media",
} as const;

export type CacheTag = (typeof CACHE_TAGS)[keyof typeof CACHE_TAGS];

/**
 * Tags whose change affects the root/site layout (tokens, fonts, logos,
 * header/footer, metadata) — admin actions touching them must also
 * revalidate the layout, not just the page.
 */
export const LAYOUT_TAGS: readonly CacheTag[] = [
  CACHE_TAGS.site,
  CACHE_TAGS.brand,
  CACHE_TAGS.theme,
  CACHE_TAGS.typography,
  CACHE_TAGS.header,
  CACHE_TAGS.footer,
  CACHE_TAGS.navigation,
  CACHE_TAGS.seo,
];
