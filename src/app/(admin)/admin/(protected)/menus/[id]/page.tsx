import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requirePageRole, SETTINGS_ROLES } from "@/lib/auth/guards";
import { updateNavigationItemAction } from "@/app/(admin)/admin/_actions/navigation";
import { AdminPage } from "@/components/admin/ui";
import { MenuItemForm } from "../MenuItemForm";

export default async function EditMenuItemPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePageRole(SETTINGS_ROLES);
  const { id } = await params;
  const item = await prisma.navigationItem.findUnique({ where: { id } });
  if (!item) notFound();

  return (
    <AdminPage eyebrow="Navegação · Menus" title="Editar link">
      <MenuItemForm
        action={updateNavigationItemAction.bind(null, id)}
        initial={{
          location: item.location,
          type: item.type,
          target: item.target,
          labelPt: item.labelPt,
          labelEn: item.labelEn,
          openInNewTab: item.openInNewTab,
          enabled: item.enabled,
        }}
      />
    </AdminPage>
  );
}
