/**
 * Locale primitives shared by the engine (server + client + seed).
 *
 * Content convention: every translatable field is stored as `xPt` (required)
 * + `xEn` (optional). Loaders turn each pair into a `Localized<T>` with the
 * fallback ALREADY applied, so components only ever pick `value[locale]` —
 * they never need to know about missing translations.
 */

export type Locale = "pt" | "en";

export const LOCALES: readonly Locale[] = ["pt", "en"] as const;

/** Used only when SiteSettings is unavailable (DB not seeded yet). */
export const FALLBACK_LOCALE: Locale = "pt";

export function isLocale(value: unknown): value is Locale {
  return value === "pt" || value === "en";
}

/** BCP 47 tag for <html lang> / Intl. */
export const LOCALE_TAGS: Record<Locale, string> = { pt: "pt-BR", en: "en" };

/** Open Graph `og:locale`. */
export const OG_LOCALES: Record<Locale, string> = { pt: "pt_BR", en: "en_US" };

/** A value available in every locale — EN already falls back to PT. */
export type Localized<T = string> = Record<Locale, T>;

const isBlank = (value: string | null | undefined): value is null | undefined | "" =>
  value === null || value === undefined || value.trim() === "";

/** PT is the source of truth; empty EN → PT. */
export function localized(pt: string, en?: string | null): Localized {
  return { pt, en: isBlank(en) ? pt : en };
}

/** Same as `localized`, but the whole value may be absent (optional copy). */
export function localizedOptional(pt?: string | null, en?: string | null): Localized | null {
  if (isBlank(pt)) return isBlank(en) ? null : { pt: en, en };
  return localized(pt, en);
}

/** Lists: an empty EN list falls back to the PT list. */
export function localizedList(pt: readonly string[], en?: readonly string[] | null): Localized<string[]> {
  const cleanPt = pt.map((s) => s.trim()).filter(Boolean);
  const cleanEn = (en ?? []).map((s) => s.trim()).filter(Boolean);
  return { pt: cleanPt, en: cleanEn.length > 0 ? cleanEn : cleanPt };
}

export function resolveLocalized<T>(value: Localized<T>, locale: Locale): T {
  return value[locale];
}

/** Maps a Localized value — e.g. to uppercase both languages. */
export function mapLocalized<T, U>(value: Localized<T>, fn: (v: T, locale: Locale) => U): Localized<U> {
  return { pt: fn(value.pt, "pt"), en: fn(value.en, "en") };
}
