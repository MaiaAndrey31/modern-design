import { z } from 'zod'

const safeMediaId = z
  .string()
  .trim()
  .min(1, 'Selecione uma mídia válida.')
  .optional()
  .or(z.literal(''))
const safeUrl = z
  .string()
  .trim()
  .refine((value) => !value || /^https?:\/\//i.test(value), 'URL inválida.')
  .optional()
  .or(z.literal(''))

export const brandSettingsSchema = z.object({
  brandName: z.string().trim().min(1, 'Informe o nome da marca.'),
  shortName: z.string().trim().min(1, 'Informe o nome curto.'),
  taglinePt: z.string().trim().min(1, 'Informe a tagline em português.'),
  taglineEn: z.string().trim().min(1, 'Informe a tagline em inglês.'),
  descriptionPt: z.string().trim().min(1, 'Informe a descrição em português.'),
  descriptionEn: z.string().trim().min(1, 'Informe a descrição em inglês.'),
  primaryLogoId: safeMediaId,
  secondaryLogoId: safeMediaId,
  lightLogoId: safeMediaId,
  darkLogoId: safeMediaId,
  faviconId: safeMediaId,
  iconId: safeMediaId,
})

export const themeSettingsSchema = z.object({
  background: z
    .string()
    .trim()
    .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Cor inválida.'),
  surface: z
    .string()
    .trim()
    .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Cor inválida.'),
  foreground: z
    .string()
    .trim()
    .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Cor inválida.'),
  textPrimary: z
    .string()
    .trim()
    .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Cor inválida.'),
  textMuted: z
    .string()
    .trim()
    .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Cor inválida.'),
  primary: z
    .string()
    .trim()
    .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Cor inválida.'),
  secondary: z
    .string()
    .trim()
    .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Cor inválida.'),
  accent: z
    .string()
    .trim()
    .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Cor inválida.'),
  border: z
    .string()
    .trim()
    .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Cor inválida.'),
  success: z
    .string()
    .trim()
    .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Cor inválida.'),
  warning: z
    .string()
    .trim()
    .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Cor inválida.'),
  danger: z
    .string()
    .trim()
    .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Cor inválida.'),
  buttonRadius: z.coerce.number().int().min(4).max(999).optional(),
  cardRadius: z.coerce.number().int().min(4).max(999).optional(),
  modalRadius: z.coerce.number().int().min(4).max(999).optional(),
  pillRadius: z.coerce.number().int().min(4).max(999).optional(),
})

export const typographySettingsSchema = z.object({
  displayFontId: z.enum([
    'inter',
    'manrope',
    'montserrat',
    'space-grotesk',
    'orbitron',
    'poppins',
    'playfair-display',
    'cormorant-garamond',
  ]),
  headingFontId: z.enum([
    'inter',
    'manrope',
    'montserrat',
    'space-grotesk',
    'orbitron',
    'poppins',
    'playfair-display',
    'cormorant-garamond',
  ]),
  bodyFontId: z.enum([
    'inter',
    'manrope',
    'montserrat',
    'space-grotesk',
    'orbitron',
    'poppins',
    'playfair-display',
    'cormorant-garamond',
  ]),
  displayWeight: z.coerce.number().int().min(300).max(900),
  headingWeight: z.coerce.number().int().min(300).max(900),
  bodyWeight: z.coerce.number().int().min(300).max(900),
})

export const headerSettingsSchema = z.object({
  logoMediaId: safeMediaId,
  mobileLogoMediaId: safeMediaId,
  showLanguageSwitch: z.boolean().optional(),
  showCta: z.boolean().optional(),
  ctaLabelPt: z.string().trim().min(1, 'Informe o texto do CTA em português.'),
  ctaLabelEn: z.string().trim().min(1, 'Informe o texto do CTA em inglês.'),
  ctaUrl: z
    .string()
    .trim()
    .refine(
      (value) => !value || /^#|^\/|^https?:\/\//i.test(value),
      'URL inválida.',
    ),
  ctaTarget: z.enum(['_self', '_blank', 'booking', 'top', 'home']),
  showSocials: z.boolean().optional(),
})

export const footerSettingsSchema = z.object({
  logoMediaId: safeMediaId,
  descriptionPt: z.string().trim().min(1, 'Informe a descrição em português.'),
  descriptionEn: z.string().trim().min(1, 'Informe a descrição em inglês.'),
  copyright: z.string().trim().min(1, 'Informe o texto de copyright.'),
  contactEmail: z
    .string()
    .trim()
    .email('E-mail inválido.')
    .optional()
    .or(z.literal('')),
  contactPhone: z.string().trim().max(50).optional().or(z.literal('')),
  showSocials: z.boolean().optional(),
  showBookingCta: z.boolean().optional(),
  bookingLabelPt: z
    .string()
    .trim()
    .min(1, 'Informe o texto do CTA em português.'),
  bookingLabelEn: z.string().trim().min(1, 'Informe o texto do CTA em inglês.'),
  bookingUrl: z
    .string()
    .trim()
    .refine(
      (value) => !value || /^#|^\/|^https?:\/\//i.test(value),
      'URL inválida.',
    ),
})

export const navigationItemSchema = z.object({
  labelPt: z.string().trim().min(1, 'Informe o rótulo em português.'),
  labelEn: z.string().trim().min(1, 'Informe o rótulo em inglês.'),
  type: z.enum(['SECTION', 'ROUTE', 'EXTERNAL']),
  targetValue: z
    .string()
    .trim()
    .refine(
      (value) => !value || /^#|^\/|^https?:\/\//i.test(value),
      'URL inválida.',
    ),
  enabled: z.boolean().optional(),
  sortOrder: z.coerce.number().int().min(0),
  location: z.enum([
    'HEADER',
    'FOOTER_PRIMARY',
    'FOOTER_SECONDARY',
    'FOOTER_LEGAL',
    'MOBILE',
  ]),
})

export const socialLinkSchema = z.object({
  platform: z.string().trim().min(1, 'Informe a plataforma.'),
  label: z.string().trim().min(1, 'Informe o rótulo.'),
  url: z
    .string()
    .trim()
    .refine((value) => !value || /^https?:\/\//i.test(value), 'URL inválida.'),
  enabled: z.boolean().optional(),
  sortOrder: z.coerce.number().int().min(0),
})
