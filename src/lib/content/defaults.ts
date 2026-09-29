/**
 * SYSTEM_DEFAULTS — the single source of default values for a fresh Modern
 * install. Used by:
 *  - the seed (system step), to create every singleton + Section row;
 *  - the content loaders, as fallback when a row is missing,
 * so the seeded state and the "not seeded yet" state are identical.
 *
 * Neutral on purpose: no client name, no client copy, no client colours.
 * Demo/client content belongs to prisma/seed/demo, never here.
 *
 * No `server-only` and relative imports only: the seed imports this file
 * under plain tsx/Node.
 */
import type { BookingFieldLabels } from "../booking/fields";
import { DEFAULT_FONT_BY_ROLE } from "../fonts/registry";
import { SECTION_KEYS, SECTION_REGISTRY, type SectionKey } from "../sections/registry";
import type { Locale } from "../i18n/locale";

type NavType = "SECTION" | "ROUTE" | "EXTERNAL";

export interface SiteSettingsDefaults {
  siteUrl: string | null;
  defaultLocale: Locale;
  contactEmail: string | null;
  contactPhone: string | null;
  whatsappNumber: string | null;
}

export interface BrandDefaults {
  brandName: string;
  shortName: string;
  monogram: string;
  taglinePt: string;
  taglineEn: string | null;
  descriptionPt: string;
  descriptionEn: string | null;
}

export interface ThemeDefaults {
  background: string;
  surface: string;
  foreground: string;
  textMuted: string;
  border: string;
  primary: string;
  primaryContrast: string;
  secondary: string;
  accent: string;
  success: string;
  danger: string;
  buttonRadius: number;
  cardRadius: number;
}

export interface TypographyDefaults {
  displayFontId: string;
  headingFontId: string;
  bodyFontId: string;
  displayWeight: number;
  headingWeight: number;
  bodyWeight: number;
  displayTracking: number;
  headingTracking: number;
  typeScale: number;
}

export interface SectionDefaults {
  enabled: boolean;
  sortOrder: number;
  eyebrowPt: string | null;
  eyebrowEn: string | null;
  titlePt: string | null;
  titleEn: string | null;
  subtitlePt: string | null;
  subtitleEn: string | null;
  descriptionPt: string | null;
  descriptionEn: string | null;
  emptyTextPt: string | null;
  emptyTextEn: string | null;
  ctaLabelPt: string | null;
  ctaLabelEn: string | null;
  ctaType: NavType | null;
  ctaTarget: string | null;
}

const section = (key: SectionKey, copy: Partial<SectionDefaults> = {}): SectionDefaults => ({
  enabled: true,
  sortOrder: SECTION_REGISTRY[key].defaultSortOrder,
  eyebrowPt: null,
  eyebrowEn: null,
  titlePt: null,
  titleEn: null,
  subtitlePt: null,
  subtitleEn: null,
  descriptionPt: null,
  descriptionEn: null,
  emptyTextPt: null,
  emptyTextEn: null,
  ctaLabelPt: null,
  ctaLabelEn: null,
  ctaType: null,
  ctaTarget: null,
  ...copy,
});

const SECTIONS: Record<SectionKey, SectionDefaults> = {
  hero: section("hero"),
  numbers: section("numbers", {
    eyebrowPt: "Desde",
    eyebrowEn: "Since",
    titlePt: "Anos",
    titleEn: "Years",
    subtitlePt: "Palcos pelo mundo",
    subtitleEn: "World stages",
  }),
  statement: section("statement"),
  story: section("story", {
    eyebrowPt: "A história",
    eyebrowEn: "The story",
    titlePt: "Uma trajetória,\ncapítulo a capítulo.",
    titleEn: "One journey,\nchapter by chapter.",
  }),
  narrative: section("narrative"),
  worldStages: section("worldStages", { titlePt: "Grandes palcos", titleEn: "Major stages" }),
  experience: section("experience", {
    eyebrowPt: "A experiência",
    eyebrowEn: "The experience",
    titlePt: "Momentos que ficam.",
    titleEn: "Moments that stay.",
  }),
  music: section("music", {
    eyebrowPt: "Música",
    eyebrowEn: "Music",
    titlePt: "Ouça.",
    titleEn: "Listen.",
    emptyTextPt: "Os lançamentos aparecerão aqui em breve.",
    emptyTextEn: "Releases will appear here soon.",
  }),
  gallery: section("gallery", {
    eyebrowPt: "Galeria",
    eyebrowEn: "Gallery",
    titlePt: "Registros.",
    titleEn: "Moments.",
  }),
  press: section("press", {
    eyebrowPt: "Imprensa",
    eyebrowEn: "Press",
    titlePt: "Na mídia.",
    titleEn: "In the press.",
    emptyTextPt: "As matérias aparecerão aqui conforme forem publicadas.",
    emptyTextEn: "Press coverage will appear here as it is published.",
  }),
  pressKit: section("pressKit", {
    eyebrowPt: "Press kit",
    eyebrowEn: "Press kit",
    titlePt: "Para produtores e imprensa.",
    titleEn: "For promoters & media.",
  }),
  shows: section("shows", {
    eyebrowPt: "Agenda",
    eyebrowEn: "Shows",
    titlePt: "Próximas datas.",
    titleEn: "Upcoming dates.",
    emptyTextPt: "Nenhuma data anunciada no momento.",
    emptyTextEn: "No dates announced right now.",
    ctaLabelPt: "Solicitar contratação",
    ctaLabelEn: "Request a booking",
    ctaType: "SECTION",
    ctaTarget: "booking",
  }),
  booking: section("booking", {
    eyebrowPt: "Contato",
    eyebrowEn: "Contact",
    titlePt: "Vamos conversar.",
    titleEn: "Let's talk.",
    descriptionPt: "Conte sobre o seu evento e retornaremos o contato.",
    descriptionEn: "Tell us about your event and we'll get back to you.",
  }),
};

const BOOKING_FIELD_LABELS: BookingFieldLabels = {
  name: { pt: "Nome", en: "Name" },
  company: { pt: "Empresa", en: "Company" },
  whatsapp: { pt: "WhatsApp", en: "WhatsApp" },
  email: { pt: "E-mail", en: "Email" },
  city: { pt: "Cidade", en: "City" },
  eventType: { pt: "Tipo de evento", en: "Event type" },
  eventDate: { pt: "Data do evento", en: "Event date" },
  message: { pt: "Mensagem", en: "Message" },
};

export const SYSTEM_DEFAULTS = {
  site: {
    siteUrl: null,
    defaultLocale: "pt",
    contactEmail: null,
    contactPhone: null,
    whatsappNumber: null,
  } satisfies SiteSettingsDefaults,

  brand: {
    brandName: "Modern",
    shortName: "Modern",
    monogram: "M",
    taglinePt: "Uma experiência digital premium.",
    taglineEn: "A premium digital experience.",
    descriptionPt: "Site construído sobre a engine Modern.",
    descriptionEn: "Website built on the Modern engine.",
  } satisfies BrandDefaults,

  /** Neutral dark palette — every client replaces it in Aparência > Cores. */
  theme: {
    background: "#0B0B0C",
    surface: "#141416",
    foreground: "#F4F4F5",
    textMuted: "#A1A1AA",
    border: "#27272A",
    primary: "#8B7CF6",
    primaryContrast: "#0B0B0C",
    secondary: "#C4B5FD",
    accent: "#E9D5FF",
    success: "#22C55E",
    danger: "#EF4444",
    buttonRadius: 999,
    cardRadius: 16,
  } satisfies ThemeDefaults,

  typography: {
    displayFontId: DEFAULT_FONT_BY_ROLE.display,
    headingFontId: DEFAULT_FONT_BY_ROLE.heading,
    bodyFontId: DEFAULT_FONT_BY_ROLE.body,
    displayWeight: 700,
    headingWeight: 700,
    bodyWeight: 400,
    displayTracking: 0,
    headingTracking: 0,
    typeScale: 1,
  } satisfies TypographyDefaults,

  header: {
    logoVariant: "primary",
    showLanguageSwitch: true,
    showSocials: false,
    showCta: true,
    ctaLabelPt: "Contato",
    ctaLabelEn: "Contact",
    ctaType: "SECTION" as NavType,
    ctaTarget: "booking",
  },

  footer: {
    logoVariant: "primary",
    showWordmark: true,
    descriptionPt: null as string | null,
    descriptionEn: null as string | null,
    copyrightPt: "© {year} {brand}. Todos os direitos reservados.",
    copyrightEn: "© {year} {brand}. All rights reserved.",
    backToTopLabelPt: "Voltar ao topo",
    backToTopLabelEn: "Back to top",
    showBookingCta: true,
    bookingLabelPt: "Contato",
    bookingLabelEn: "Contact",
    bookingType: "SECTION" as NavType,
    bookingTarget: "booking",
    showSocials: true,
    showContact: false,
  },

  seo: {
    /** Empty title → "{brandName} — {tagline}" at render time. */
    metaTitlePt: "",
    metaTitleEn: null as string | null,
    /** Empty description → BrandSettings.description at render time. */
    metaDescriptionPt: "",
    metaDescriptionEn: null as string | null,
    twitterHandle: null as string | null,
    robotsIndex: true,
  },

  profile: {
    rolesPt: [] as string[],
    rolesEn: [] as string[],
    bioPt: "",
    bioEn: null as string | null,
    originLabelPt: null as string | null,
    originLabelEn: null as string | null,
    foundedYear: null as number | null,
  },

  sections: SECTIONS,

  hero: {
    /** Empty → BrandSettings.brandName. */
    headlineLinesPt: [] as string[],
    headlineLinesEn: [] as string[],
    youtubeUrl: null as string | null,
    enableWebgl: true,
    foundedLabelPt: "Desde" as string | null,
    foundedLabelEn: "Est." as string | null,
    primaryCtaLabelPt: "Explorar" as string | null,
    primaryCtaLabelEn: "Explore" as string | null,
    primaryCtaType: "SECTION" as NavType,
    primaryCtaTarget: "story" as string | null,
    secondaryCtaLabelPt: "Contato" as string | null,
    secondaryCtaLabelEn: "Contact" as string | null,
    secondaryCtaType: "SECTION" as NavType,
    secondaryCtaTarget: "booking" as string | null,
  },

  statement: {
    linesPt: [] as string[],
    linesEn: [] as string[],
    accentIndex: null as number | null,
    showGlobe: true,
  },

  narrative: {
    linesPt: [] as string[],
    linesEn: [] as string[],
    finalWordPt: null as string | null,
    finalWordEn: null as string | null,
    vhPerLine: 95,
  },

  story: {
    introQuestionPt: null as string | null,
    introQuestionEn: null as string | null,
    thesisLinesPt: [] as string[],
    thesisLinesEn: [] as string[],
    outroLinesPt: [] as string[],
    outroLinesEn: [] as string[],
  },

  pressKit: {
    bioOverridePt: null as string | null,
    bioOverrideEn: null as string | null,
    downloadsNotePt: null as string | null,
    downloadsNoteEn: null as string | null,
  },

  booking: {
    successTitlePt: "Solicitação recebida.",
    successTitleEn: "Request received.",
    successMessagePt: "Obrigado — retornaremos o contato em breve.",
    successMessageEn: "Thank you — we'll be in touch shortly.",
    submitLabelPt: "Enviar solicitação",
    submitLabelEn: "Send request",
    pausedMessagePt: "As solicitações estão temporariamente pausadas. Volte em breve.",
    pausedMessageEn: "Requests are temporarily paused. Please check back soon.",
    fieldLabels: BOOKING_FIELD_LABELS,
    notifyEmail: null as string | null,
    isFormEnabled: true,
  },
} as const;

/** Section keys in their default order — the seed creates one Section row per key. */
export const DEFAULT_SECTION_ORDER: readonly SectionKey[] = [...SECTION_KEYS].sort(
  (a, b) => SECTION_REGISTRY[a].defaultSortOrder - SECTION_REGISTRY[b].defaultSortOrder
);
