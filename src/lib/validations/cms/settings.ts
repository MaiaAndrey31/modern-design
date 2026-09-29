import { z } from "zod";
import { FONT_IDS, FONT_WEIGHTS } from "@/lib/fonts/registry";
import { LOGO_VARIANTS, NAVIGATION_LOCATIONS } from "@/lib/navigation/registry";
import { SOCIAL_PLATFORM_IDS, urlMatchesPlatform, type SocialPlatformId } from "@/lib/social/registry";
import { THEME_RADIUS_TOKENS } from "@/lib/theme/registry";
import {
  entityId,
  hexColor,
  lines,
  navigationItemType,
  optionalEmail,
  optionalHttpsUrl,
  optionalLink,
  optionalMediaId,
  optionalPhoneDigits,
  optionalText,
  ptText,
  requiredLink,
  sortOrder,
} from "./common";

// ---------------------------------------------------------------------------
// Site (technical)
// ---------------------------------------------------------------------------

export const siteSettingsSchema = z.object({
  siteUrl: optionalHttpsUrl.transform((v) => (v ? v.replace(/\/+$/, "") : null)),
  defaultLocale: z.enum(["pt", "en"]),
  contactEmail: optionalEmail,
  contactPhone: optionalPhoneDigits,
  whatsappNumber: optionalPhoneDigits,
});
export type SiteSettingsInput = z.infer<typeof siteSettingsSchema>;

// ---------------------------------------------------------------------------
// Brand (universal identity)
// ---------------------------------------------------------------------------

export const brandSettingsSchema = z.object({
  brandName: ptText(80, "Nome da marca"),
  shortName: ptText(40, "Nome curto"),
  monogram: z
    .string()
    .trim()
    .min(1, "Informe a sigla.")
    .max(3, "A sigla pode ter até 3 caracteres."),
  taglinePt: ptText(160, "Tagline"),
  taglineEn: optionalText(160),
  descriptionPt: ptText(600, "Descrição"),
  descriptionEn: optionalText(600),
  primaryLogoId: optionalMediaId,
  secondaryLogoId: optionalMediaId,
  lightLogoId: optionalMediaId,
  darkLogoId: optionalMediaId,
  iconId: optionalMediaId,
  faviconId: optionalMediaId,
});
export type BrandSettingsInput = z.infer<typeof brandSettingsSchema>;

// ---------------------------------------------------------------------------
// Theme
// ---------------------------------------------------------------------------

const radius = (key: (typeof THEME_RADIUS_TOKENS)[number]["key"]) => {
  const token = THEME_RADIUS_TOKENS.find((t) => t.key === key)!;
  return z.coerce.number().int().min(token.min).max(token.max);
};

export const themeSettingsSchema = z.object({
  background: hexColor,
  surface: hexColor,
  foreground: hexColor,
  textMuted: hexColor,
  border: hexColor,
  primary: hexColor,
  primaryContrast: hexColor,
  secondary: hexColor,
  accent: hexColor,
  success: hexColor,
  danger: hexColor,
  buttonRadius: radius("buttonRadius"),
  cardRadius: radius("cardRadius"),
});
export type ThemeSettingsInput = z.infer<typeof themeSettingsSchema>;

// ---------------------------------------------------------------------------
// Typography — ids validated against the FontRegistry (no Prisma enum)
// ---------------------------------------------------------------------------

const fontId = z.enum(FONT_IDS as [string, ...string[]], "Fonte não disponível no registro.");
const fontWeight = z.coerce
  .number()
  .int()
  .refine((w) => (FONT_WEIGHTS as readonly number[]).includes(w), "Peso inválido.");

export const typographySettingsSchema = z.object({
  displayFontId: fontId,
  headingFontId: fontId,
  bodyFontId: fontId,
  displayWeight: fontWeight,
  headingWeight: fontWeight,
  bodyWeight: fontWeight,
  displayTracking: z.coerce.number().min(-0.1).max(0.5),
  headingTracking: z.coerce.number().min(-0.1).max(0.5),
  typeScale: z.coerce.number().min(0.85).max(1.15),
});
export type TypographySettingsInput = z.infer<typeof typographySettingsSchema>;

// ---------------------------------------------------------------------------
// Header / footer / navigation
// ---------------------------------------------------------------------------

const logoVariant = z.enum(LOGO_VARIANTS);

export const headerSettingsSchema = z
  .object({
    logoVariant,
    showLanguageSwitch: z.boolean(),
    showSocials: z.boolean(),
    showCta: z.boolean(),
    cta: optionalLink,
  })
  .superRefine((value, ctx) => {
    if (value.showCta && !value.cta.labelPt) {
      ctx.addIssue({ code: "custom", path: ["cta", "labelPt"], message: "Informe o CTA ou desative-o." });
    }
  });
export type HeaderSettingsInput = z.infer<typeof headerSettingsSchema>;

export const footerSettingsSchema = z
  .object({
    logoVariant,
    showWordmark: z.boolean(),
    descriptionPt: optionalText(600),
    descriptionEn: optionalText(600),
    copyrightPt: ptText(200, "Copyright"),
    copyrightEn: optionalText(200),
    backToTopLabelPt: ptText(40, "Voltar ao topo"),
    backToTopLabelEn: optionalText(40),
    showBookingCta: z.boolean(),
    bookingCta: optionalLink,
    showSocials: z.boolean(),
    showContact: z.boolean(),
  })
  .superRefine((value, ctx) => {
    if (value.showBookingCta && !value.bookingCta.labelPt) {
      ctx.addIssue({ code: "custom", path: ["bookingCta", "labelPt"], message: "Informe o CTA ou desative-o." });
    }
  });
export type FooterSettingsInput = z.infer<typeof footerSettingsSchema>;

export const navigationItemSchema = z
  .object({
    location: z.enum(NAVIGATION_LOCATIONS),
    enabled: z.boolean(),
    openInNewTab: z.boolean(),
    sortOrder,
  })
  .and(requiredLink);
export type NavigationItemInput = z.infer<typeof navigationItemSchema>;

export const reorderSchema = z.array(entityId).min(1).max(200);

// ---------------------------------------------------------------------------
// Social links
// ---------------------------------------------------------------------------

export const socialLinkSchema = z
  .object({
    platform: z.enum(SOCIAL_PLATFORM_IDS as [string, ...string[]], "Plataforma desconhecida."),
    label: z.string().trim().min(1, "Informe o rótulo.").max(60),
    url: z
      .string()
      .trim()
      .max(2048)
      .refine((value) => {
        try {
          return new URL(value).protocol === "https:";
        } catch {
          return false;
        }
      }, "Use um link completo começando com https://."),
    enabled: z.boolean(),
    showInHeader: z.boolean(),
    showInFooter: z.boolean(),
    showInMusic: z.boolean(),
    sortOrder,
  })
  .superRefine((value, ctx) => {
    if (!urlMatchesPlatform(value.platform as SocialPlatformId, value.url)) {
      ctx.addIssue({ code: "custom", path: ["url"], message: "O link não pertence a esta plataforma." });
    }
  });
export type SocialLinkInput = z.infer<typeof socialLinkSchema>;

// ---------------------------------------------------------------------------
// SEO
// ---------------------------------------------------------------------------

export const seoSettingsSchema = z.object({
  /** Empty → "{brand} — {tagline}". */
  metaTitlePt: optionalText(70).transform((v) => v ?? ""),
  metaTitleEn: optionalText(70),
  /** Empty → brand description. */
  metaDescriptionPt: optionalText(200).transform((v) => v ?? ""),
  metaDescriptionEn: optionalText(200),
  ogImageId: optionalMediaId,
  twitterHandle: z
    .union([z.string().trim().regex(/^@?[A-Za-z0-9_]{1,15}$/, "Use o formato @usuario."), z.literal(""), z.null()]).optional()
    .transform((v) => (v ? (v.startsWith("@") ? v : `@${v}`) : null)),
  robotsIndex: z.boolean(),
});
export type SeoSettingsInput = z.infer<typeof seoSettingsSchema>;

// ---------------------------------------------------------------------------
// Profile (template content)
// ---------------------------------------------------------------------------

export const profileSchema = z.object({
  rolesPt: lines(6, 40),
  rolesEn: lines(6, 40),
  bioPt: z.string().trim().max(4000).default(""),
  bioEn: optionalText(4000),
  originLabelPt: optionalText(80),
  originLabelEn: optionalText(80),
  foundedYear: z
    .union([z.literal(""), z.null(), z.coerce.number().int().min(1800).max(2100)]).optional()
    .transform((v) => (typeof v === "number" ? v : null)),
});
export type ProfileInput = z.infer<typeof profileSchema>;

export { navigationItemType };
