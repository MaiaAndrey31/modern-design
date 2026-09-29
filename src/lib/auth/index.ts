import "server-only";
import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db";
import { authConfig } from "./config";

// The Prisma adapter is inert for Credentials-based sign-in (Auth.js never
// persists Credentials users through the adapter, by design) — it's wired
// up now purely so adding an OAuth provider later is a config change, not a
// migration (Account/Session/VerificationToken tables already exist).
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
});
