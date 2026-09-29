/**
 * Theme tokens stored in ThemeSettings and the CSS custom property each one
 * becomes. The injector (Phase 6) writes `:root { --bg: …; }` from these;
 * globals.css maps them into Tailwind's @theme. Derived tints/shades are
 * computed in CSS with color-mix(), never stored.
 */

export const THEME_COLOR_TOKENS = [
  { key: "background", cssVar: "--bg", label: "Fundo" },
  { key: "surface", cssVar: "--surface", label: "Superfície (cards, áreas elevadas)" },
  { key: "foreground", cssVar: "--fg", label: "Texto principal" },
  { key: "textMuted", cssVar: "--fg-muted", label: "Texto secundário" },
  { key: "border", cssVar: "--border", label: "Bordas" },
  { key: "primary", cssVar: "--primary", label: "Cor principal" },
  { key: "primaryContrast", cssVar: "--primary-contrast", label: "Texto sobre a cor principal" },
  { key: "secondary", cssVar: "--secondary", label: "Cor secundária" },
  { key: "accent", cssVar: "--accent", label: "Cor de destaque" },
  { key: "success", cssVar: "--success", label: "Sucesso" },
  { key: "danger", cssVar: "--danger", label: "Erro" },
] as const;

export type ThemeColorKey = (typeof THEME_COLOR_TOKENS)[number]["key"];

export const THEME_RADIUS_TOKENS = [
  { key: "buttonRadius", cssVar: "--radius-button", label: "Raio dos botões", min: 0, max: 999 },
  { key: "cardRadius", cssVar: "--radius-card", label: "Raio dos cards", min: 0, max: 64 },
] as const;

export type ThemeRadiusKey = (typeof THEME_RADIUS_TOKENS)[number]["key"];

export const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;

/** WCAG relative luminance of "#RRGGBB". */
export function relativeLuminance(hex: string): number {
  const channel = (i: number) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
}

/** WCAG contrast ratio between two "#RRGGBB" colours (1–21). */
export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}
