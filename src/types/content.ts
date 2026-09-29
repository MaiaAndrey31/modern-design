export interface TimelineMilestone {
  year: string;
  title: string;
  subtitle?: string;
  description: string;
  image?: string;
}

export interface WorldStage {
  year: string;
  title: string;
  location: string;
  description: string;
  image: string;
  video?: string;
}

export interface Show {
  date: string;
  city: string;
  venue: string;
  country?: string;
  ticketUrl?: string;
  soldOut?: boolean;
}

export interface Release {
  title: string;
  year: string;
  cover: string;
  spotifyUrl?: string;
  appleMusicUrl?: string;
  type: "single" | "ep" | "album" | "remix";
  /** True while this entry is a placeholder awaiting real release data. */
  isPlaceholder?: boolean;
}

export interface GalleryItem {
  id: string;
  src: string;
  alt: string;
  caption?: string;
  orientation: "portrait" | "landscape" | "square";
  isPlaceholder?: boolean;
}

export interface PressItem {
  outlet: string;
  title: string;
  date: string;
  url?: string;
  excerpt?: string;
}

export interface SocialLink {
  platform: "instagram" | "spotify" | "appleMusic" | "youtube" | "tiktok" | "whatsapp";
  label: string;
  url: string;
  /** False while the URL is still a placeholder ("#") awaiting the real link. */
  configured: boolean;
}

export interface BookingFormData {
  name: string;
  company?: string;
  whatsapp: string;
  email: string;
  city: string;
  eventType: string;
  eventDate?: string;
  message?: string;
}
