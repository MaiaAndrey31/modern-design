/**
 * Social / streaming platforms the engine knows (label + icon key). Stored in
 * SocialLink.platform as a plain string — adding a platform is one entry here
 * (plus its icon in the UI), no migration. Unknown values render with the
 * generic "link" icon, so an old row never breaks the site.
 */

export interface SocialPlatformDefinition {
  id: string;
  label: string;
  /** Icon key resolved by the UI icon set. */
  icon: string;
  /** Streaming platforms are offered for the Music section. */
  streaming: boolean;
  /** Hostnames accepted for this platform's URL (empty = any https URL). */
  hosts: readonly string[];
}

export const SOCIAL_PLATFORMS = {
  instagram: { id: "instagram", label: "Instagram", icon: "instagram", streaming: false, hosts: ["instagram.com"] },
  youtube: { id: "youtube", label: "YouTube", icon: "youtube", streaming: true, hosts: ["youtube.com", "youtu.be", "music.youtube.com"] },
  spotify: { id: "spotify", label: "Spotify", icon: "spotify", streaming: true, hosts: ["spotify.com", "spotify.link"] },
  apple_music: { id: "apple_music", label: "Apple Music", icon: "apple-music", streaming: true, hosts: ["music.apple.com"] },
  soundcloud: { id: "soundcloud", label: "SoundCloud", icon: "soundcloud", streaming: true, hosts: ["soundcloud.com", "on.soundcloud.com"] },
  deezer: { id: "deezer", label: "Deezer", icon: "deezer", streaming: true, hosts: ["deezer.com", "deezer.page.link"] },
  tiktok: { id: "tiktok", label: "TikTok", icon: "tiktok", streaming: false, hosts: ["tiktok.com"] },
  facebook: { id: "facebook", label: "Facebook", icon: "facebook", streaming: false, hosts: ["facebook.com", "fb.com"] },
  x: { id: "x", label: "X", icon: "x", streaming: false, hosts: ["x.com", "twitter.com"] },
  linkedin: { id: "linkedin", label: "LinkedIn", icon: "linkedin", streaming: false, hosts: ["linkedin.com"] },
  whatsapp: { id: "whatsapp", label: "WhatsApp", icon: "whatsapp", streaming: false, hosts: ["wa.me", "whatsapp.com", "api.whatsapp.com"] },
  website: { id: "website", label: "Website", icon: "link", streaming: false, hosts: [] },
  custom: { id: "custom", label: "Outro", icon: "link", streaming: false, hosts: [] },
} as const satisfies Record<string, SocialPlatformDefinition>;

export type SocialPlatformId = keyof typeof SOCIAL_PLATFORMS;

export const SOCIAL_PLATFORM_IDS = Object.keys(SOCIAL_PLATFORMS) as SocialPlatformId[];

export function isSocialPlatformId(value: unknown): value is SocialPlatformId {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(SOCIAL_PLATFORMS, value);
}

export function getSocialPlatform(value: string): SocialPlatformDefinition {
  return isSocialPlatformId(value) ? SOCIAL_PLATFORMS[value] : SOCIAL_PLATFORMS.custom;
}

/** True when `url`'s hostname belongs to the platform (or the platform accepts any host). */
export function urlMatchesPlatform(platform: SocialPlatformId, url: string): boolean {
  const { hosts } = SOCIAL_PLATFORMS[platform];
  if (hosts.length === 0) return true;
  try {
    const host = new URL(url).hostname.toLowerCase().replace(/^www\./, "");
    return hosts.some((h) => host === h || host.endsWith(`.${h}`));
  } catch {
    return false;
  }
}
