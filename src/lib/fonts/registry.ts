/**
 * Font Registry — the ONLY list of fonts the site can load.
 *
 * TypographySettings stores registry ids (plain strings) per ROLE
 * (display / heading / body). A font definition knows nothing about roles:
 * the same font can serve any of them. The runtime loader (Phase 6) reads the
 * selected ids, resolves them here and loads only those fonts and weights —
 * no URL ever comes from the database or the admin.
 *
 * Adding a font = adding one entry below. No migration, no env var.
 */

export type FontRole = "display" | "heading" | "body";

export const FONT_ROLES: readonly FontRole[] = ["display", "heading", "body"] as const;

export type FontWeight = 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;

export const FONT_WEIGHTS: readonly FontWeight[] = [100, 200, 300, 400, 500, 600, 700, 800, 900] as const;

export type FontCategory = "sans" | "serif" | "display" | "mono";

/**
 * Where the files come from. The loader switches on `provider`; the rest of
 * the engine (TypographySettings, admin, tokens) never sees the difference.
 */
export type FontSource =
  | {
      provider: "google";
      /** Family name exactly as Google Fonts expects it in the css2 API. */
      family: string;
      /** Variable font: request one file covering this weight range. */
      variableWeight?: readonly [FontWeight, FontWeight];
    }
  | {
      /** Reserved for self-hosted files (e.g. Supabase Storage / public). Not implemented yet. */
      provider: "self";
      files: readonly { weight: FontWeight; style: "normal" | "italic"; path: string; format: "woff2" }[];
    };

export interface FontDefinition {
  id: string;
  label: string;
  /** CSS font-family name used in @font-face / var(--font-*). */
  family: string;
  category: FontCategory;
  /** Static weights the font actually ships (for variable fonts: weights offered in the admin). */
  weights: readonly FontWeight[];
  source: FontSource;
  /** Generic/system fallbacks appended after the web font. */
  fallback: readonly string[];
}

const SANS_FALLBACK = ["system-ui", "-apple-system", "Segoe UI", "Roboto", "Arial", "sans-serif"] as const;
const SERIF_FALLBACK = ["Georgia", "Times New Roman", "serif"] as const;

export const FONT_REGISTRY = {
  inter: {
    id: "inter",
    label: "Inter",
    family: "Inter",
    category: "sans",
    weights: [300, 400, 500, 600, 700, 800, 900],
    source: { provider: "google", family: "Inter", variableWeight: [100, 900] },
    fallback: SANS_FALLBACK,
  },
  manrope: {
    id: "manrope",
    label: "Manrope",
    family: "Manrope",
    category: "sans",
    weights: [300, 400, 500, 600, 700, 800],
    source: { provider: "google", family: "Manrope", variableWeight: [200, 800] },
    fallback: SANS_FALLBACK,
  },
  montserrat: {
    id: "montserrat",
    label: "Montserrat",
    family: "Montserrat",
    category: "sans",
    weights: [300, 400, 500, 600, 700, 800, 900],
    source: { provider: "google", family: "Montserrat", variableWeight: [100, 900] },
    fallback: SANS_FALLBACK,
  },
  poppins: {
    id: "poppins",
    label: "Poppins",
    family: "Poppins",
    category: "sans",
    weights: [300, 400, 500, 600, 700, 800, 900],
    source: { provider: "google", family: "Poppins" },
    fallback: SANS_FALLBACK,
  },
  "space-grotesk": {
    id: "space-grotesk",
    label: "Space Grotesk",
    family: "Space Grotesk",
    category: "sans",
    weights: [300, 400, 500, 600, 700],
    source: { provider: "google", family: "Space Grotesk", variableWeight: [300, 700] },
    fallback: SANS_FALLBACK,
  },
  orbitron: {
    id: "orbitron",
    label: "Orbitron",
    family: "Orbitron",
    category: "display",
    weights: [400, 500, 600, 700, 800, 900],
    source: { provider: "google", family: "Orbitron", variableWeight: [400, 900] },
    fallback: SANS_FALLBACK,
  },
  "playfair-display": {
    id: "playfair-display",
    label: "Playfair Display",
    family: "Playfair Display",
    category: "serif",
    weights: [400, 500, 600, 700, 800, 900],
    source: { provider: "google", family: "Playfair Display", variableWeight: [400, 900] },
    fallback: SERIF_FALLBACK,
  },
  "cormorant-garamond": {
    id: "cormorant-garamond",
    label: "Cormorant Garamond",
    family: "Cormorant Garamond",
    category: "serif",
    weights: [300, 400, 500, 600, 700],
    source: { provider: "google", family: "Cormorant Garamond" },
    fallback: SERIF_FALLBACK,
  },
} as const satisfies Record<string, FontDefinition>;

export type FontId = keyof typeof FONT_REGISTRY;

export const FONT_IDS = Object.keys(FONT_REGISTRY) as FontId[];

/** Engine defaults per role — used when TypographySettings is missing or holds an unknown id. */
export const DEFAULT_FONT_BY_ROLE: Record<FontRole, FontId> = {
  display: "space-grotesk",
  heading: "space-grotesk",
  body: "inter",
};

export function isFontId(value: unknown): value is FontId {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(FONT_REGISTRY, value);
}

/** Never throws: an unknown/removed id resolves to the role's default font. */
export function resolveFont(fontId: string | null | undefined, role: FontRole): FontDefinition {
  return FONT_REGISTRY[isFontId(fontId) ? fontId : DEFAULT_FONT_BY_ROLE[role]];
}

/** Closest weight the font actually ships (e.g. 800 on a font that stops at 700 → 700). */
export function closestWeight(font: FontDefinition, weight: number): FontWeight {
  return font.weights.reduce((best, w) => (Math.abs(w - weight) < Math.abs(best - weight) ? w : best), font.weights[0]);
}

/** CSS font-family stack: quoted family + fallbacks. */
export function fontStack(font: FontDefinition): string {
  const quote = (name: string) => (/[\s-]/.test(name) || /^\d/.test(name) ? `"${name}"` : name);
  return [quote(font.family), ...font.fallback.map((f) => (f.includes(" ") ? `"${f}"` : f))].join(", ");
}
