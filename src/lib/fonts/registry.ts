export type FontProvider = 'google' | 'system'

export type FontWeight = 300 | 400 | 500 | 600 | 700 | 800 | 900

export interface FontDefinition {
  id: string
  label: string
  family: string
  provider: FontProvider
  weights: FontWeight[]
  fallback: string
  cssVariable: string
}

export const fontRegistry: Record<string, FontDefinition> = {
  inter: {
    id: 'inter',
    label: 'Inter',
    family: 'Inter',
    provider: 'google',
    weights: [400, 500, 600, 700, 800],
    fallback: 'sans-serif',
    cssVariable: '--font-body',
  },
  manrope: {
    id: 'manrope',
    label: 'Manrope',
    family: 'Manrope',
    provider: 'google',
    weights: [400, 500, 600, 700, 800],
    fallback: 'sans-serif',
    cssVariable: '--font-body',
  },
  montserrat: {
    id: 'montserrat',
    label: 'Montserrat',
    family: 'Montserrat',
    provider: 'google',
    weights: [400, 500, 600, 700, 800],
    fallback: 'sans-serif',
    cssVariable: '--font-heading',
  },
  'space-grotesk': {
    id: 'space-grotesk',
    label: 'Space Grotesk',
    family: '"Space Grotesk"',
    provider: 'google',
    weights: [400, 500, 600, 700],
    fallback: 'sans-serif',
    cssVariable: '--font-display',
  },
  orbitron: {
    id: 'orbitron',
    label: 'Orbitron',
    family: 'Orbitron',
    provider: 'google',
    weights: [400, 500, 600, 700, 800, 900],
    fallback: 'sans-serif',
    cssVariable: '--font-display',
  },
  poppins: {
    id: 'poppins',
    label: 'Poppins',
    family: 'Poppins',
    provider: 'google',
    weights: [400, 500, 600, 700, 800],
    fallback: 'sans-serif',
    cssVariable: '--font-heading',
  },
  'playfair-display': {
    id: 'playfair-display',
    label: 'Playfair Display',
    family: '"Playfair Display"',
    provider: 'google',
    weights: [400, 500, 600, 700],
    fallback: 'serif',
    cssVariable: '--font-display',
  },
  'cormorant-garamond': {
    id: 'cormorant-garamond',
    label: 'Cormorant Garamond',
    family: '"Cormorant Garamond"',
    provider: 'google',
    weights: [400, 500, 600, 700],
    fallback: 'serif',
    cssVariable: '--font-display',
  },
}

export const fontIds = Object.keys(fontRegistry)

export function isKnownFontId(
  value: string,
): value is keyof typeof fontRegistry {
  return value in fontRegistry
}

export function getFontDefinition(fontId: string | null | undefined) {
  if (!fontId || !isKnownFontId(fontId)) {
    return fontRegistry.inter
  }

  return fontRegistry[fontId]
}
