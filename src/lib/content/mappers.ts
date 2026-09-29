/**
 * Row → DTO helpers shared by the content loaders. Pure functions: they only
 * shape data, never query.
 */
import type { Media, NavigationItemType } from "@/generated/prisma/client";
import { localized, localizedOptional } from "@/lib/i18n/locale";
import { isSectionKey } from "@/lib/sections/registry";
import { resolveLinkHref } from "@/lib/navigation/registry";
import type { LinkDto, MediaRef } from "./dto";

export function toMediaRef(row: Media | null | undefined): MediaRef | null {
  if (!row) return null;
  return { url: row.url, width: row.width, height: row.height, alt: row.alt, mimeType: row.mimeType };
}

/**
 * Builds a link from a (type, target) pair plus its PT/EN label. Returns null
 * when the label is empty or the target is invalid — "no CTA → no button",
 * never a dead link.
 */
export function toLink(
  type: NavigationItemType | null | undefined,
  target: string | null | undefined,
  labelPt: string | null | undefined,
  labelEn?: string | null,
  /** Omitted → external links open in a new tab, internal ones don't. */
  openInNewTab?: boolean
): LinkDto | null {
  if (!type) return null;
  const label = localizedOptional(labelPt, labelEn);
  const href = resolveLinkHref(type, target);
  if (!label || !href) return null;
  const external = type === "EXTERNAL";
  return {
    label,
    href,
    sectionKey: type === "SECTION" && isSectionKey(target) ? target : null,
    external,
    openInNewTab: openInNewTab ?? external,
  };
}

/** Required copy that may still be blank in a half-filled row → fall back to a default pair. */
export function localizedOr(pt: string | null | undefined, en: string | null | undefined, fallback: { pt: string; en?: string | null }) {
  return localizedOptional(pt, en) ?? localized(fallback.pt, fallback.en);
}

export const ORIENTATION_MAP = { PORTRAIT: "portrait", LANDSCAPE: "landscape", SQUARE: "square" } as const;

export const RELEASE_TYPE_MAP = { SINGLE: "single", EP: "ep", ALBUM: "album", REMIX: "remix" } as const;

export function startOfTodayUTC(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}
