import { redirect } from "next/navigation";

/** "Carreira" was split into História (chapters) and World Stages. */
export default function LegacyCareerRedirect() {
  redirect("/admin/world-stages");
}
