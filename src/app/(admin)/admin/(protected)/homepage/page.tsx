import { redirect } from "next/navigation";

/** The old "Página inicial" screen was split into Hero, Statement and Perfil. */
export default function LegacyHomepageRedirect() {
  redirect("/admin/hero");
}
