/**
 * Plain, serializable shapes returned by src/lib/content/*.ts to the public
 * site's Server/Client Components. Never pass a raw Prisma row across that
 * boundary — Date/Decimal aren't safely serializable, and admin-only fields
 * (e.g. Show.internalNotes, BookingSection.notifyEmail) must never leak into
 * the client bundle.
 *
 * Every translatable value is `Localized` with the EN → PT fallback already
 * applied: components only pick `value[locale]`.
 */
import type { Locale, Localized } from "@/lib/i18n/locale";
import type { SectionKey } from "@/lib/sections/registry";
import type { LabelPosition, StoryVisualType } from "@/lib/story/registry";
import type { LogoVariant, NavigationLocationId } from "@/lib/navigation/registry";
import type { BookingFormField } from "@/lib/booking/fields";
import type { ThemeDefaults, TypographyDefaults } from "./defaults";

// ---------------------------------------------------------------------------
// Shared
// ---------------------------------------------------------------------------

export interface MediaRef {
  url: string;
  width: number | null;
  height: number | null;
  alt: string | null;
  mimeType: string;
}

export interface LinkDto {
  label: Localized;
  href: string;
  /** Section key when the link scrolls to an in-page section (hidden if that section doesn't render). */
  sectionKey: SectionKey | null;
  external: boolean;
  openInNewTab: boolean;
}

// ---------------------------------------------------------------------------
// Global settings
// ---------------------------------------------------------------------------

export interface SiteConfigDto {
  siteUrl: string | null;
  defaultLocale: Locale;
  contactEmail: string | null;
  contactPhone: string | null;
  whatsappNumber: string | null;
}

export interface BrandDto {
  brandName: string;
  shortName: string;
  monogram: string;
  tagline: Localized;
  description: Localized;
  logos: Record<LogoVariant, MediaRef | null>;
  icon: MediaRef | null;
  favicon: MediaRef | null;
  /** ISO timestamp — cache-busts favicon/icon URLs after a change. */
  updatedAt: string | null;
}

export type ThemeDto = ThemeDefaults;

export type TypographyDto = TypographyDefaults;

export interface ProfileDto {
  roles: Localized<string[]>;
  bio: Localized | null;
  originLabel: Localized | null;
  foundedYear: number | null;
}

export interface HeaderDto {
  logoVariant: LogoVariant;
  showLanguageSwitch: boolean;
  showSocials: boolean;
  cta: LinkDto | null;
}

export interface FooterDto {
  logoVariant: LogoVariant;
  showWordmark: boolean;
  description: Localized | null;
  /** Raw template — {year} and {brand} are replaced at render time. */
  copyright: Localized;
  backToTopLabel: Localized;
  bookingCta: LinkDto | null;
  showSocials: boolean;
  showContact: boolean;
}

export type NavigationDto = Record<NavigationLocationId, LinkDto[]>;

export interface SocialLinkDto {
  id: string;
  /** SOCIAL_PLATFORMS id, or "custom" for unknown values. */
  platform: string;
  label: string;
  url: string;
  icon: string;
  showInHeader: boolean;
  showInFooter: boolean;
  showInMusic: boolean;
}

export interface SeoDto {
  /** Always resolved: SeoSettings → "{brand} — {tagline}". */
  metaTitle: Localized;
  /** Always resolved: SeoSettings → BrandSettings.description. */
  metaDescription: Localized;
  ogImage: MediaRef | null;
  twitterHandle: string | null;
  robotsIndex: boolean;
}

// ---------------------------------------------------------------------------
// Sections
// ---------------------------------------------------------------------------

export interface SectionDto {
  key: SectionKey;
  enabled: boolean;
  sortOrder: number;
  anchor: string | null;
  eyebrow: Localized | null;
  title: Localized | null;
  subtitle: Localized | null;
  description: Localized | null;
  emptyText: Localized | null;
  cta: LinkDto | null;
}

export interface SectionsDto {
  /** Every known section, keyed (disabled ones included — callers decide). */
  byKey: Record<SectionKey, SectionDto>;
  /** Enabled sections in render order: hero first, then by sortOrder. */
  ordered: SectionKey[];
}

export interface HeroDto {
  /** Already falls back to the brand name. */
  headlineLines: Localized<string[]>;
  backgroundImage: MediaRef | null;
  video: MediaRef | null;
  youtubeId: string | null;
  posterImage: MediaRef | null;
  enableWebgl: boolean;
  foundedLabel: Localized | null;
  primaryCta: LinkDto | null;
  secondaryCta: LinkDto | null;
}

export interface StatementDto {
  lines: Localized<string[]>;
  accentIndex: number | null;
  backgroundImage: MediaRef | null;
  showGlobe: boolean;
}

export interface NarrativeDto {
  lines: Localized<string[]>;
  /** Already falls back to the brand name. */
  finalWord: Localized;
  vhPerLine: number;
  backgroundImage: MediaRef | null;
}

export interface PlaceDto {
  id: string;
  name: Localized;
  latitude: number;
  longitude: number;
  labelPosition: LabelPosition;
  cameraWidthDeg: number | null;
  isOrigin: boolean;
  showOnGlobe: boolean;
  globeOrder: number | null;
}

export interface StoryChapterDto {
  id: string;
  periodLabel: Localized;
  axisLabel: string | null;
  /** Already falls back to the first 4 characters of the period label. */
  ghostLabel: Localized;
  concept: Localized;
  title: Localized;
  placeLabel: Localized | null;
  text: Localized;
  pullQuote: Localized | null;
  visualType: StoryVisualType;
  image: MediaRef | null;
  allowPhoto: boolean;
  showRings: boolean;
  startsGlobalAct: boolean;
  scrollWeight: number;
  /** Place ids, in camera order. */
  cameraPlaceIds: string[];
  labelPlaceIds: string[];
  pulsePlaceId: string | null;
  route: { fromPlaceId: string; toPlaceId: string } | null;
}

export interface StoryDto {
  introQuestion: Localized | null;
  thesisLines: Localized<string[]>;
  outroLines: Localized<string[]>;
  chapters: StoryChapterDto[];
  /** Every place referenced by a published chapter or shown on the globe. */
  places: PlaceDto[];
}

export interface StageDto {
  id: string;
  year: string;
  title: Localized;
  location: Localized;
  description: Localized;
  image: MediaRef | null;
  video: MediaRef | null;
  showInNumbers: boolean;
}

export interface ExperienceFrameDto {
  slot: number;
  layout: "WIDE" | "TALL";
  offsetPx: number;
  media: MediaRef | null;
  alt: Localized;
}

export interface ReleaseDto {
  id: string;
  title: string;
  year: string;
  type: "single" | "ep" | "album" | "remix";
  cover: MediaRef | null;
  spotifyUrl: string | null;
  appleMusicUrl: string | null;
  youtubeUrl: string | null;
  soundcloudUrl: string | null;
}

export interface GalleryItemDto {
  id: string;
  image: MediaRef;
  /** Real dimensions from upload — never guessed (no CLS). */
  width: number;
  height: number;
  alt: Localized;
  caption: Localized | null;
  orientation: "portrait" | "landscape" | "square";
}

export interface PressItemDto {
  id: string;
  outlet: string;
  title: string;
  date: string;
  url: string | null;
  excerpt: Localized | null;
  logo: MediaRef | null;
}

export interface PressKitDto {
  /** Already falls back to Profile.bio (null when neither exists). */
  bio: Localized | null;
  downloadsNote: Localized | null;
  oneSheet: MediaRef | null;
  photoPack: MediaRef | null;
  logoPack: MediaRef | null;
}

/** `date` is always a plain "YYYY-MM-DD" string — never a Date/ISO-datetime. */
export interface ShowDto {
  id: string;
  title: string | null;
  date: string;
  time: string | null;
  city: string;
  state: string | null;
  venue: string;
  country: string | null;
  ticketUrl: string | null;
  soldOut: boolean;
  featured: boolean;
  image: MediaRef | null;
}

export interface BookingDto {
  successTitle: Localized;
  successMessage: Localized;
  submitLabel: Localized;
  pausedMessage: Localized;
  fieldLabels: Record<BookingFormField, Localized>;
  isFormEnabled: boolean;
}
