/**
 * Navigation vocabulary shared by NavigationItem, header/footer CTAs and
 * section CTAs: every link is a (type, target) pair validated here.
 */
import { isSectionKey, sectionAnchor } from "../sections/registry";

export const NAVIGATION_LOCATIONS = ["HEADER", "FOOTER_PRIMARY", "FOOTER_SECONDARY", "FOOTER_LEGAL"] as const;
export type NavigationLocationId = (typeof NAVIGATION_LOCATIONS)[number];

export const NAVIGATION_LOCATION_LABELS: Record<NavigationLocationId, string> = {
  HEADER: "Header (e menu mobile)",
  FOOTER_PRIMARY: "Footer — principal",
  FOOTER_SECONDARY: "Footer — secundário",
  FOOTER_LEGAL: "Footer — legal",
};

export const NAVIGATION_ITEM_TYPES = ["SECTION", "ROUTE", "EXTERNAL"] as const;
export type NavigationItemTypeId = (typeof NAVIGATION_ITEM_TYPES)[number];

export const NAVIGATION_ITEM_TYPE_LABELS: Record<NavigationItemTypeId, string> = {
  SECTION: "Seção da página",
  ROUTE: "Página do site",
  EXTERNAL: "Link externo",
};

/** Which BrandSettings logo a header/footer shows. */
export const LOGO_VARIANTS = ["primary", "secondary", "light", "dark"] as const;
export type LogoVariant = (typeof LOGO_VARIANTS)[number];

export const LOGO_VARIANT_LABELS: Record<LogoVariant, string> = {
  primary: "Logo principal",
  secondary: "Logo alternativa",
  light: "Logo clara",
  dark: "Logo escura",
};

export function isLogoVariant(value: unknown): value is LogoVariant {
  return typeof value === "string" && (LOGO_VARIANTS as readonly string[]).includes(value);
}

const ROUTE_PATTERN = /^\/(?!\/)[A-Za-z0-9\-._~/%]*(\?[A-Za-z0-9\-._~=&%]*)?(#[A-Za-z0-9\-._~]*)?$/;

/** Validates a link target for its type. Returns an error message (PT) or null. */
export function validateLinkTarget(type: NavigationItemTypeId, target: string): string | null {
  const value = target.trim();
  if (!value) return "Informe o destino.";
  switch (type) {
    case "SECTION":
      return isSectionKey(value) && sectionAnchor(value) ? null : "Seção desconhecida.";
    case "ROUTE":
      return ROUTE_PATTERN.test(value) ? null : "Use um caminho interno começando com / (ex.: /contato).";
    case "EXTERNAL":
      try {
        const url = new URL(value);
        return url.protocol === "https:" || url.protocol === "mailto:" || url.protocol === "tel:"
          ? null
          : "Use um link https://, mailto: ou tel:.";
      } catch {
        return "URL inválida.";
      }
  }
}

/** Resolves a validated (type, target) into an href. Unknown/invalid targets → null (link not rendered). */
export function resolveLinkHref(type: NavigationItemTypeId, target: string | null | undefined): string | null {
  if (!target || validateLinkTarget(type, target) !== null) return null;
  if (type === "SECTION") return `#${sectionAnchor(target)}`;
  return target.trim();
}
