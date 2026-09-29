/**
 * Google Fonts css2 URLs built ONLY from FontRegistry entries — never from a
 * string stored in the DB or typed in the admin. Shared by the admin
 * typography preview now and by the site's runtime loader (Phase 6).
 */
import { FONT_REGISTRY, isFontId, type FontDefinition, type FontId } from "./registry";

const GOOGLE_CSS_ORIGIN = "https://fonts.googleapis.com";

function familyParam(font: FontDefinition, weights?: readonly number[]): string | null {
  if (font.source.provider !== "google") return null;
  const name = font.source.family.replace(/ /g, "+");
  const range = font.source.variableWeight;
  const axis = range
    ? `${range[0]}..${range[1]}`
    : [...new Set(weights?.length ? weights : font.weights)].sort((a, b) => a - b).join(";");
  return `family=${name}:wght@${axis}`;
}

/**
 * One stylesheet URL for the given fonts (duplicates and unknown ids are
 * dropped). `weights` narrows static fonts; variable fonts always load their
 * single range file. Returns null when nothing is served by Google.
 */
export function googleFontsHref(fontIds: readonly string[], weights?: Partial<Record<FontId, readonly number[]>>): string | null {
  const ids = [...new Set(fontIds)].filter(isFontId);
  const params = ids.map((id) => familyParam(FONT_REGISTRY[id], weights?.[id])).filter((p): p is string => p !== null);
  if (params.length === 0) return null;
  return `${GOOGLE_CSS_ORIGIN}/css2?${params.join("&")}&display=swap`;
}
