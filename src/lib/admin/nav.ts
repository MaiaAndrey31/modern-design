import type { Role } from "@/lib/auth/guards";
import type { SectionKey } from "@/lib/sections/registry";

export interface AdminNavLink {
  href: string;
  label: string;
  /** Roles that can open it (default: everyone with admin access). */
  roles?: Role[];
}

export interface AdminNavGroup {
  title?: string;
  links: AdminNavLink[];
}

const ADMIN_ONLY: Role[] = ["ADMIN"];

/** Admin editor of each public section. */
export const SECTION_ADMIN_ROUTES: Record<SectionKey, string> = {
  hero: "/admin/hero",
  numbers: "/admin/numbers",
  statement: "/admin/statement",
  story: "/admin/story",
  narrative: "/admin/narrative",
  worldStages: "/admin/world-stages",
  experience: "/admin/experience",
  music: "/admin/releases",
  gallery: "/admin/gallery",
  press: "/admin/press",
  pressKit: "/admin/press-kit",
  shows: "/admin/shows",
  booking: "/admin/booking",
};

export const ADMIN_NAV: AdminNavGroup[] = [
  { links: [{ href: "/admin", label: "Dashboard" }] },
  {
    title: "Conteúdo",
    links: [
      { href: "/admin/sections", label: "Seções", roles: ADMIN_ONLY },
      { href: "/admin/profile", label: "Perfil" },
      { href: "/admin/hero", label: "Hero" },
      { href: "/admin/numbers", label: "Números" },
      { href: "/admin/statement", label: "Statement" },
      { href: "/admin/story", label: "História" },
      { href: "/admin/places", label: "Lugares" },
      { href: "/admin/narrative", label: "Transição" },
      { href: "/admin/world-stages", label: "World Stages" },
      { href: "/admin/experience", label: "Experience" },
      { href: "/admin/releases", label: "Música" },
      { href: "/admin/gallery", label: "Galeria" },
      { href: "/admin/press", label: "Imprensa" },
      { href: "/admin/press-kit", label: "Press Kit" },
      { href: "/admin/shows", label: "Agenda" },
      { href: "/admin/booking", label: "Booking" },
    ],
  },
  {
    title: "Aparência",
    links: [
      { href: "/admin/brand", label: "Marca", roles: ADMIN_ONLY },
      { href: "/admin/colors", label: "Cores", roles: ADMIN_ONLY },
      { href: "/admin/typography", label: "Tipografia", roles: ADMIN_ONLY },
    ],
  },
  {
    title: "Navegação",
    links: [
      { href: "/admin/header", label: "Header", roles: ADMIN_ONLY },
      { href: "/admin/menus", label: "Menus", roles: ADMIN_ONLY },
      { href: "/admin/footer", label: "Footer", roles: ADMIN_ONLY },
      { href: "/admin/social", label: "Redes sociais" },
    ],
  },
  { title: "Mídia", links: [{ href: "/admin/media", label: "Biblioteca" }] },
  {
    title: "Configurações",
    links: [
      { href: "/admin/settings", label: "Site", roles: ADMIN_ONLY },
      { href: "/admin/seo", label: "SEO", roles: ADMIN_ONLY },
    ],
  },
];

/** Bottom bar on mobile — the most used screens; everything else is under "Mais". */
export const ADMIN_MOBILE_PRIMARY: AdminNavLink[] = [
  { href: "/admin", label: "Início" },
  { href: "/admin/shows", label: "Agenda" },
  { href: "/admin/media", label: "Mídia" },
];

export function visibleNav(role: Role): AdminNavGroup[] {
  return ADMIN_NAV.map((group) => ({ ...group, links: group.links.filter((l) => !l.roles || l.roles.includes(role)) })).filter(
    (group) => group.links.length > 0
  );
}
