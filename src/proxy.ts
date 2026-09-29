import { NextResponse, type NextRequest } from "next/server";

/**
 * Coarse UX gate only — redirects to /admin/login when no session cookie is
 * present. Deliberately does NOT import Prisma/auth() here: per the Next.js
 * 16 docs, proxy "is meant to be invoked separately of your render code...
 * you should not attempt relying on shared modules or globals," and real
 * authorization happens in src/app/(admin)/admin/(protected)/layout.tsx
 * (redirect-based) and src/lib/auth/guards.ts's requireRole() inside every
 * admin Server Action/Route Handler (proxy does not cover Server Functions —
 * see the Next.js docs' own warning on this).
 */
export function proxy(request: NextRequest) {
  const hasSession =
    request.cookies.has("authjs.session-token") || request.cookies.has("__Secure-authjs.session-token");

  if (!hasSession) {
    const url = new URL("/admin/login", request.url);
    url.searchParams.set("callbackUrl", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
}

export const config = {
  matcher: ["/admin/((?!login).*)"],
};
