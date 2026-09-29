import { requirePageRole, SETTINGS_ROLES } from "@/lib/auth/guards";
import { NAVIGATION_LOCATIONS, type NavigationLocationId } from "@/lib/navigation/registry";
import { createNavigationItemAction } from "@/app/(admin)/admin/_actions/navigation";
import { AdminPage } from "@/components/admin/ui";
import { MenuItemForm } from "../MenuItemForm";

export default async function NewMenuItemPage({ searchParams }: { searchParams: Promise<{ location?: string }> }) {
  await requirePageRole(SETTINGS_ROLES);
  const { location } = await searchParams;
  const initialLocation = (NAVIGATION_LOCATIONS as readonly string[]).includes(location ?? "") ? (location as NavigationLocationId) : "HEADER";

  return (
    <AdminPage eyebrow="Navegação · Menus" title="Novo link">
      <MenuItemForm
        action={createNavigationItemAction}
        initial={{ location: initialLocation, type: "SECTION", target: "", labelPt: "", labelEn: null, openInNewTab: false, enabled: true }}
      />
    </AdminPage>
  );
}
