/**
 * Plain, serializable shapes returned by src/lib/content/*.ts to the public
 * site's Server/Client Components. Never pass a raw Prisma row across that
 * boundary — Date/Decimal aren't safely serializable, and admin-only fields
 * (e.g. Show.internalNotes) must never leak into the client bundle.
 */

export interface SiteDto {
  artistName: string;
  roles: string[];
  startYear: number;
  tagline: string;
  originStatement: string;
  signaturePhrase: string | null;
  bioShort: string;
  bioFull: string;
  whatsappNumber: string | null;
  footerNote: string | null;
}

export interface HeroDto {
  headlineLines: string[];
  eyebrow: string | null;
  backgroundUrl: string | null;
  videoUrl: string | null;
  youtubeId: string | null;
  posterUrl: string | null;
  enableWebgl: boolean;
  primaryCtaLabel: string;
  primaryCtaTarget: string;
  secondaryCtaLabel: string;
  secondaryCtaTarget: string;
}

export interface StatementDto {
  lines: string[];
  accentIndex: number | null;
  backgroundUrl: string | null;
}

export interface MilestoneDto {
  id: string;
  year: string;
  title: string;
  subtitle: string | null;
  description: string;
  image: string | null;
}

export interface StoryDto {
  content: { eyebrow: string; headingLine1: string; headingLine2: string };
  milestones: MilestoneDto[];
}

export interface StageDto {
  id: string;
  year: string;
  title: string;
  location: string;
  description: string;
  imageUrl: string | null;
  videoUrl: string | null;
  showInNumbers: boolean;
}

export interface NarrativeDto {
  lines: string[];
  finalWord: string;
  backgroundUrl: string | null;
  vhPerLine: number;
}

export interface FrameDto {
  slot: number;
  layout: "WIDE" | "TALL";
  offsetPx: number;
  mediaUrl: string | null;
  alt: string;
}

export interface ExperienceDto {
  eyebrow: string;
  heading: string;
  frames: FrameDto[];
}

export interface ReleaseDto {
  id: string;
  title: string;
  year: string;
  cover: string | null;
  spotifyUrl: string | null;
  appleMusicUrl: string | null;
  youtubeUrl: string | null;
  type: "single" | "ep" | "album" | "remix";
}

export interface GalleryDto {
  id: string;
  src: string;
  alt: string;
  caption: string | null;
  orientation: "portrait" | "landscape" | "square";
  width: number;
  height: number;
}

export interface PressDto {
  id: string;
  outlet: string;
  title: string;
  date: string;
  url: string | null;
  excerpt: string | null;
}

export interface PressKitDto {
  eyebrow: string;
  heading: string;
  bio: string;
  downloadsNote: string | null;
}

/** `date` is always a plain "YYYY-MM-DD" string — never a Date/ISO-datetime. See UpcomingShows.formatDate(). */
export interface ShowDto {
  id: string;
  title: string | null;
  date: string;
  city: string;
  venue: string;
  country: string | null;
  ticketUrl: string | null;
  soldOut: boolean;
}

export interface SocialLinkDto {
  platform: "instagram" | "spotify" | "appleMusic" | "youtube" | "tiktok" | "whatsapp";
  label: string;
  url: string;
  configured: boolean;
}

export interface BookingSettingsDto {
  eyebrow: string;
  heading: string;
  intro: string;
  successTitle: string;
  successMessage: string;
  isFormEnabled: boolean;
}

export interface SeoDto {
  metaTitle: string;
  metaDescription: string;
  ogImageUrl: string | null;
  twitterHandle: string | null;
  robotsIndex: boolean;
}
