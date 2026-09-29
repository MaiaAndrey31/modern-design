import "dotenv/config";
import { defineConfig } from "prisma/config";

// Used only by the Prisma CLI (migrate/studio/db push) — always the direct
// (non-pooled) Supabase connection, port 5432. The running app never reads
// this; see src/lib/db.ts for the pooled runtime connection.
export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    // process.env (not prisma's env(), which throws when unset) so that
    // `prisma generate` — run by postinstall on Vercel — works without any
    // database env vars. migrate/studio still fail clearly if it's missing.
    url: process.env.DIRECT_URL,
  },
});
