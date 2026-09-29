import type { DefaultSession } from "next-auth";

type AppRole = "ADMIN" | "EDITOR";

declare module "next-auth" {
  interface User {
    role: AppRole;
  }
  interface Session {
    user: {
      id: string;
      role: AppRole;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: AppRole;
  }
}

// next-auth/jwt re-exports from @auth/core/jwt via `export *` — the
// Credentials callback signatures type against the latter directly, so it
// must be augmented too or `token.id`/`token.role` fall back to `unknown`
// (via JWT's `Record<string, unknown>` base) despite the augmentation above.
declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    role: AppRole;
  }
}
