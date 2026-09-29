import type { ReactNode } from "react";
import { requireSession } from "@/lib/auth/guards";
import { AdminShell } from "./AdminShell";

// Admin content must never be served from a cache — every request reflects
// the current session/content state.
export const dynamic = "force-dynamic";

export default async function ProtectedAdminLayout({ children }: { children: ReactNode }) {
  const session = await requireSession();

  return <AdminShell userName={session.user.email ?? session.user.name ?? "Admin"}>{children}</AdminShell>;
}
