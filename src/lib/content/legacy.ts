import "server-only";
/**
 * TEMPORARY bridge (Phase 3 → Phase 5).
 *
 * The public components still consume the pre-Modern DTO shapes
 * (legacyDto.ts). These adapters build them from the new bilingual loaders so
 * the site keeps compiling and behaving as before while the domain changes
 * underneath. Resolution uses EN, which is what the pre-Modern site rendered
 * on the server (PT was applied client-side via tc()).
 *
 * Phase 5 moves every component to the new DTOs + useLocale().l() and deletes
 * this file, legacyDto.ts and the exact-match translation table.
 */
import type { Localized } from "@/lib/i18n/locale";
import type { LinkDto } from "./dto";
import type * as Legacy from "./legacyDto";
import { getBrand } from "./brand";
import { getProfile } from "./profile";
import { getSiteConfig } from "./site";
import { getFooter } from "./footer";
import { getSections } from "./sections";
import { getHero } from "./hero";
import { getStatement } from "./statement";
import { getStory } from "./story";
import { getNarrative } from "./narrative";
import { getWorldStages } from "./worldStages";
import { getExperienceFrames } from "./experience";
import { getReleases } from "./releases";
import { getGallery } from "./gallery";
import { getPress, getPressKit } from "./press";
import { getUpcomingShows } from "./shows";
import { getSocialLinks } from "./social";
import { getBooking } from "./booking";
import { getSeo } from "./seo";

const LEGACY_LOCALE = "en" as const;
const en = (value: Localized | null | undefined, fallback = ""): string => value?.[LEGACY_LOCALE] ?? fallback;
const target = (link: LinkDto | null) => (link ? link.href.replace(/^#/, "") : "");

export async function getLegacySite(): Promise<Legacy.SiteDto> {
  const [brand, profile, site, footer] = await Promise.all([getBrand(), getProfile(), getSiteConfig(), getFooter()]);
  return {
    artistName: brand.brandName,
    roles: profile.roles[LEGACY_LOCALE],
    startYear: profile.foundedYear ?? new Date().getFullYear(),
    tagline: en(brand.tagline),
    originStatement: "",
    signaturePhrase: null,
    bioShort: en(brand.description),
    bioFull: en(profile.bio, en(brand.description)),
    whatsappNumber: site.whatsappNumber,
    footerNote: footer.description ? en(footer.description) : null,
  };
}

export async function getLegacyHero(): Promise<Legacy.HeroDto> {
  const [hero, sections] = await Promise.all([getHero(), getSections()]);
  return {
    headlineLines: hero.headlineLines[LEGACY_LOCALE],
    eyebrow: sections.byKey.hero.eyebrow ? en(sections.byKey.hero.eyebrow) : null,
    backgroundUrl: hero.backgroundImage?.url ?? null,
    videoUrl: hero.video?.url ?? null,
    youtubeId: hero.youtubeId,
    posterUrl: hero.posterImage?.url ?? null,
    enableWebgl: hero.enableWebgl,
    primaryCtaLabel: en(hero.primaryCta?.label),
    primaryCtaTarget: target(hero.primaryCta),
    secondaryCtaLabel: en(hero.secondaryCta?.label),
    secondaryCtaTarget: target(hero.secondaryCta),
  };
}

export async function getLegacyStatement(): Promise<Legacy.StatementDto> {
  const statement = await getStatement();
  return {
    lines: statement.lines[LEGACY_LOCALE],
    accentIndex: statement.accentIndex,
    backgroundUrl: statement.backgroundImage?.url ?? null,
  };
}

export async function getLegacyStory(): Promise<Legacy.StoryDto> {
  const [story, sections] = await Promise.all([getStory(), getSections()]);
  const section = sections.byKey.story;
  const [line1 = "", line2 = ""] = en(section.title).split("\n");
  return {
    content: { eyebrow: en(section.eyebrow), headingLine1: line1, headingLine2: line2 },
    milestones: story.chapters.map((chapter) => ({
      id: chapter.id,
      year: en(chapter.periodLabel),
      title: en(chapter.title),
      subtitle: en(chapter.concept) || null,
      description: en(chapter.text),
      image: chapter.image?.url ?? null,
    })),
  };
}

export async function getLegacyNarrative(): Promise<Legacy.NarrativeDto> {
  const narrative = await getNarrative();
  return {
    lines: narrative.lines[LEGACY_LOCALE],
    finalWord: en(narrative.finalWord),
    backgroundUrl: narrative.backgroundImage?.url ?? null,
    vhPerLine: narrative.vhPerLine,
  };
}

export async function getLegacyStages(): Promise<Legacy.StageDto[]> {
  const stages = await getWorldStages();
  return stages.map((stage) => ({
    id: stage.id,
    year: stage.year,
    title: en(stage.title),
    location: en(stage.location),
    description: en(stage.description),
    imageUrl: stage.image?.url ?? null,
    videoUrl: stage.video?.url ?? null,
    showInNumbers: stage.showInNumbers,
  }));
}

export async function getLegacyExperience(): Promise<Legacy.ExperienceDto> {
  const [frames, sections] = await Promise.all([getExperienceFrames(), getSections()]);
  return {
    eyebrow: en(sections.byKey.experience.eyebrow),
    heading: en(sections.byKey.experience.title),
    frames: frames.map((frame) => ({
      slot: frame.slot,
      layout: frame.layout,
      offsetPx: frame.offsetPx,
      mediaUrl: frame.media?.url ?? null,
      alt: en(frame.alt),
    })),
  };
}

export async function getLegacyReleases(): Promise<Legacy.ReleaseDto[]> {
  const releases = await getReleases();
  return releases.map((r) => ({
    id: r.id,
    title: r.title,
    year: r.year,
    cover: r.cover?.url ?? null,
    spotifyUrl: r.spotifyUrl,
    appleMusicUrl: r.appleMusicUrl,
    youtubeUrl: r.youtubeUrl,
    type: r.type,
  }));
}

export async function getLegacyGallery(): Promise<Legacy.GalleryDto[]> {
  const items = await getGallery();
  return items.map((item) => ({
    id: item.id,
    src: item.image.url,
    alt: en(item.alt),
    caption: item.caption ? en(item.caption) : null,
    orientation: item.orientation,
    width: item.width,
    height: item.height,
  }));
}

export async function getLegacyPress(): Promise<Legacy.PressDto[]> {
  const items = await getPress();
  return items.map((item) => ({
    id: item.id,
    outlet: item.outlet,
    title: item.title,
    date: item.date,
    url: item.url,
    excerpt: item.excerpt ? en(item.excerpt) : null,
  }));
}

export async function getLegacyPressKit(): Promise<Legacy.PressKitDto> {
  const [kit, sections] = await Promise.all([getPressKit(), getSections()]);
  return {
    eyebrow: en(sections.byKey.pressKit.eyebrow),
    heading: en(sections.byKey.pressKit.title),
    bio: en(kit.bio),
    downloadsNote: kit.downloadsNote ? en(kit.downloadsNote) : null,
  };
}

export async function getLegacyShows(): Promise<Legacy.ShowDto[]> {
  const shows = await getUpcomingShows();
  return shows.map((show) => ({
    id: show.id,
    title: show.title,
    date: show.date,
    city: show.city,
    venue: show.venue,
    country: show.country,
    ticketUrl: show.ticketUrl,
    soldOut: show.soldOut,
  }));
}

const LEGACY_PLATFORMS: Record<string, Legacy.SocialLinkDto["platform"]> = {
  instagram: "instagram",
  spotify: "spotify",
  apple_music: "appleMusic",
  youtube: "youtube",
  tiktok: "tiktok",
  whatsapp: "whatsapp",
};

export async function getLegacySocialLinks(): Promise<Legacy.SocialLinkDto[]> {
  const links = await getSocialLinks();
  return links.flatMap((link) => {
    const platform = LEGACY_PLATFORMS[link.platform];
    return platform ? [{ platform, label: link.label, url: link.url, configured: true }] : [];
  });
}

export async function getLegacyBooking(): Promise<Legacy.BookingSettingsDto> {
  const [booking, sections] = await Promise.all([getBooking(), getSections()]);
  const section = sections.byKey.booking;
  return {
    eyebrow: en(section.eyebrow),
    heading: en(section.title),
    intro: en(section.description),
    successTitle: en(booking.successTitle),
    successMessage: en(booking.successMessage),
    isFormEnabled: booking.isFormEnabled,
  };
}

export async function getLegacySeo(): Promise<Legacy.SeoDto> {
  const seo = await getSeo();
  return {
    metaTitle: en(seo.metaTitle),
    metaDescription: en(seo.metaDescription),
    ogImageUrl: seo.ogImage?.url ?? null,
    twitterHandle: seo.twitterHandle,
    robotsIndex: seo.robotsIndex,
  };
}
