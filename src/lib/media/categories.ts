/**
 * Media categories — logical metadata stored in Media.category (a plain
 * string, so a new category needs no migration).
 *
 * The category chosen at upload time also becomes the first segment of the
 * storage path (src/lib/storage/paths.ts). That path never changes after the
 * upload: re-categorising a file only updates metadata.
 */

export const MEDIA_CATEGORIES = [
  "branding",
  "hero",
  "sections",
  "story",
  "stages",
  "experience",
  "gallery",
  "music",
  "press",
  "shows",
  "seo",
  "general",
] as const;

export type MediaCategory = (typeof MEDIA_CATEGORIES)[number];

export const MEDIA_CATEGORY_LABELS: Record<MediaCategory, string> = {
  branding: "Marca (logos, favicon)",
  hero: "Hero",
  sections: "Fundos de seções",
  story: "História",
  stages: "World Stages",
  experience: "Experience",
  gallery: "Galeria",
  music: "Música",
  press: "Imprensa / Press Kit",
  shows: "Agenda",
  seo: "SEO / compartilhamento",
  general: "Geral",
};

export const DEFAULT_MEDIA_CATEGORY: MediaCategory = "general";

export function isMediaCategory(value: unknown): value is MediaCategory {
  return typeof value === "string" && (MEDIA_CATEGORIES as readonly string[]).includes(value);
}
