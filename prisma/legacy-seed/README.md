# Legacy seed — REFERENCE ONLY

Pre-Modern seed of the copied project (Alan Saher content), written against
the **old** schema (TimelineEvent, SiteSettings.artistName, …).

- **Do not run it.** It is excluded from TypeScript (`tsconfig.json` →
  `exclude`) and `npm run db:seed` refuses to start until the new seed exists.
- It is kept only as the source of the current site content, which Phase 8
  converts into the Modern demo seed (`prisma/seed/demo`).
- Delete this folder once the demo seed covers everything here.
