import type { ReactNode } from "react";
import { requireSession } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { SINGLETON_ID } from "@/lib/content/singleton";
import { SYSTEM_DEFAULTS } from "@/lib/content/defaults";
import { AdminShell } from "./AdminShell";

// Admin content must never be served from a cache — every request reflects
// the current session/content state.
export const dynamic = "force-dynamic";

export default async function ProtectedAdminLayout({ children }: { children: ReactNode }) {
  const session = await requireSession();
  const brand = await prisma.brandSettings.findUnique({ where: { id: SINGLETON_ID }, select: { brandName: true } });

  return (
    <AdminShell
      userName={session.user.email ?? session.user.name ?? "Admin"}
      role={session.user.role}
      brandName={brand?.brandName ?? SYSTEM_DEFAULTS.brand.brandName}
    >
      {children}
    </AdminShell>
  );
}
