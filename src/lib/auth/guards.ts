import "server-only";
import { redirect } from "next/navigation";
import { auth } from "./index";

type Role = "ADMIN" | "EDITOR";

/** For Server Components/layouts: redirects to /admin/login when there's no session. */
export async function requireSession() {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");
  return session;
}

/**
 * For Server Actions and Route Handlers. MANDATORY as the first statement of
 * every admin mutation — proxy.ts only redirects unauthenticated *page*
 * requests, it does not (and per the Next.js docs, cannot reliably) cover
 * Server Function calls. Throws rather than redirecting, since actions/route
 * handlers aren't page navigations.
 */
export async function requireRole(roles: Role[]) {
  const session = await auth();
  if (!session?.user || !roles.includes(session.user.role)) {
    throw new Error("Unauthorized");
  }
  return session.user;
}
