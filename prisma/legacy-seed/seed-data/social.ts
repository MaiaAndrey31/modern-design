import type { SocialLink } from "@/types/content";

/**
 * Social + platform links. Real URLs were not provided in the brief, so every
 * entry ships with `configured: false` and a "#" href — the UI treats these
 * as disabled/"coming soon" rather than broken links. Set `configured: true`
 * and fill in `url` once the real profile links are confirmed.
 * See README > "Como alterar links sociais".
 */
export const socialLinks: SocialLink[] = [
  { platform: "instagram", label: "Instagram", url: "#", configured: false },
  { platform: "spotify", label: "Spotify", url: "#", configured: false },
  { platform: "appleMusic", label: "Apple Music", url: "#", configured: false },
];

export const whatsappBookingNumber = ""; // TODO: e.g. "5535999999999" (digits only, country+area code)
