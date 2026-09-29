/**
 * SECTION_REGISTRY — which sections the template ships and how the engine
 * treats them. Pure metadata (no component imports), safe for server,
 * client, admin and seed.
 *
 *  - `Section` rows in the DB hold enabled/sortOrder + generic copy; this
 *    registry says which generic fields each section uses and how the admin
 *    labels them, so a section with only "eyebrow/title/empty state" needs no
 *    table of its own.
 *  - Hero is always first and cannot be disabled (the Preloader hands its
 *    intro timeline to it). The Footer is not a section — always last.
 *  - Order changes are safe for ScrollTrigger: triggers are sorted by DOM
 *    position before every refresh (src/lib/gsap.ts → requestScrollRefresh).
 */

export const SECTION_KEYS = [
  "hero",
  "numbers",
  "statement",
  "story",
  "narrative",
  "worldStages",
  "experience",
  "music",
  "gallery",
  "press",
  "pressKit",
  "shows",
  "booking",
] as const;

export type SectionKey = (typeof SECTION_KEYS)[number];

export type SectionGenericField = "eyebrow" | "title" | "subtitle" | "description" | "emptyText" | "cta";

export interface SectionFieldMeta {
  /** Admin label (PT — the admin UI language). */
  label: string;
  help?: string;
  multiline?: boolean;
}

export interface SectionDefinition {
  key: SectionKey;
  /** Admin name. */
  label: string;
  /** DOM id used for in-page navigation (null = not a navigation target). */
  anchor: string | null;
  /** "first" = pinned at the top, ignores sortOrder. */
  position: "first" | "flow";
  toggleable: boolean;
  /** Order used by the seed and when a Section row is missing. */
  defaultSortOrder: number;
  /** Generic Section fields this section renders, with their admin labels. */
  fields: Partial<Record<SectionGenericField, SectionFieldMeta>>;
  /** Specific model holding the section's own structure (documentation / admin routing). */
  specificModel?: string;
}

const define = <const T extends Record<SectionKey, Omit<SectionDefinition, "key">>>(defs: T) =>
  Object.fromEntries(Object.entries(defs).map(([key, def]) => [key, { key, ...def }])) as {
    [K in keyof T]: SectionDefinition & { key: K };
  };

export const SECTION_REGISTRY = define({
  hero: {
    label: "Hero",
    anchor: "top",
    position: "first",
    toggleable: false,
    defaultSortOrder: 0,
    fields: {
      eyebrow: { label: "Eyebrow", help: "Vazio = funções do perfil (ex.: DJ · Produtor)." },
    },
    specificModel: "HeroSection",
  },
  numbers: {
    label: "Números",
    anchor: "numbers",
    position: "flow",
    toggleable: true,
    defaultSortOrder: 10,
    fields: {
      eyebrow: { label: "Rótulo antes do ano", help: "Ex.: Desde" },
      title: { label: "Rótulo dos anos", help: "Ex.: Anos" },
      subtitle: { label: "Rótulo dos palcos", help: "Ex.: Palcos pelo mundo" },
    },
  },
  statement: {
    label: "Statement",
    anchor: "statement",
    position: "flow",
    toggleable: true,
    defaultSortOrder: 20,
    fields: {},
    specificModel: "StatementSection",
  },
  story: {
    label: "História",
    anchor: "story",
    position: "flow",
    toggleable: true,
    defaultSortOrder: 30,
    fields: {
      eyebrow: { label: "Eyebrow" },
      title: { label: "Título", help: "Uma linha por quebra de linha.", multiline: true },
    },
    specificModel: "StorySection + StoryChapter",
  },
  narrative: {
    label: "Transição narrativa",
    anchor: "manifesto",
    position: "flow",
    toggleable: true,
    defaultSortOrder: 40,
    fields: {},
    specificModel: "NarrativeSection",
  },
  worldStages: {
    label: "World Stages",
    anchor: "stages",
    position: "flow",
    toggleable: true,
    defaultSortOrder: 50,
    fields: {
      title: { label: "Título" },
    },
    specificModel: "WorldStage",
  },
  experience: {
    label: "Experience",
    anchor: "experience",
    position: "flow",
    toggleable: true,
    defaultSortOrder: 60,
    fields: {
      eyebrow: { label: "Eyebrow" },
      title: { label: "Título" },
    },
    specificModel: "ExperienceFrame",
  },
  music: {
    label: "Música",
    anchor: "music",
    position: "flow",
    toggleable: true,
    defaultSortOrder: 70,
    fields: {
      eyebrow: { label: "Eyebrow" },
      title: { label: "Título" },
      emptyText: { label: "Texto sem lançamentos", multiline: true },
    },
    specificModel: "Release",
  },
  gallery: {
    label: "Galeria",
    anchor: "gallery",
    position: "flow",
    toggleable: true,
    defaultSortOrder: 80,
    fields: {
      eyebrow: { label: "Eyebrow" },
      title: { label: "Título" },
    },
    specificModel: "GalleryItem",
  },
  press: {
    label: "Imprensa",
    anchor: "press",
    position: "flow",
    toggleable: true,
    defaultSortOrder: 90,
    fields: {
      eyebrow: { label: "Eyebrow" },
      title: { label: "Título" },
      emptyText: { label: "Texto sem matérias", multiline: true },
    },
    specificModel: "PressItem",
  },
  pressKit: {
    label: "Press Kit",
    anchor: "press-kit",
    position: "flow",
    toggleable: true,
    defaultSortOrder: 100,
    fields: {
      eyebrow: { label: "Eyebrow" },
      title: { label: "Título" },
    },
    specificModel: "PressKitSection",
  },
  shows: {
    label: "Agenda",
    anchor: "shows",
    position: "flow",
    toggleable: true,
    defaultSortOrder: 110,
    fields: {
      eyebrow: { label: "Eyebrow" },
      title: { label: "Título" },
      emptyText: { label: "Texto sem datas", multiline: true },
      cta: { label: "CTA de contratação" },
    },
    specificModel: "Show",
  },
  booking: {
    label: "Booking",
    anchor: "booking",
    position: "flow",
    toggleable: true,
    defaultSortOrder: 120,
    fields: {
      eyebrow: { label: "Eyebrow" },
      title: { label: "Título" },
      description: { label: "Introdução", multiline: true },
    },
    specificModel: "BookingSection",
  },
});

export function isSectionKey(value: unknown): value is SectionKey {
  return typeof value === "string" && (SECTION_KEYS as readonly string[]).includes(value);
}

export function getSectionDefinition(key: SectionKey): SectionDefinition {
  return SECTION_REGISTRY[key];
}

/** Anchor id for a SECTION navigation target, or null if the key is unknown / not navigable. */
export function sectionAnchor(key: string): string | null {
  return isSectionKey(key) ? SECTION_REGISTRY[key].anchor : null;
}
