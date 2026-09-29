# Alan Saher — The Experience

Premium, cinematic one-page website for DJ/producer **Alan Saher**, with a full content
management admin panel. Built with Next.js (App Router), TypeScript, Tailwind CSS v4, GSAP +
ScrollTrigger, Lenis smooth scroll, a single React Three Fiber effect in the Hero, PostgreSQL
(Supabase) via Prisma, Auth.js v5, and Supabase Storage for uploads.

```
Public site   → src/app/(site)  → dark, cinematic, GSAP/Lenis/Three.js
Admin panel   → src/app/(admin) → light, plain, no animation stack
```

The two are deliberately isolated (separate route groups/layouts) — the admin never loads
the public site's motion libraries, and the public site never loads admin code.

---

## 1. Install

```bash
npm install
```

`npm install` runs `prisma generate` automatically (`postinstall` script) — this requires
`DATABASE_URL`/`DIRECT_URL` to at least be *set* in `.env` (they don't need to be reachable
yet just to generate the client; see §7 to point them at a real database).

## 2. Run (development)

```bash
npm run dev
```

Opens at `http://localhost:3000`. Admin panel: `http://localhost:3000/admin`.

## 3. Build (production)

```bash
npm run lint
npm run typecheck
npm run build
npm run start
```

Always run all three after content or code changes. `npm run build` also runs a full
TypeScript check as part of compilation.

---

## 4. CMS / Admin

### 4.1 How the admin is protected

- `src/proxy.ts` — a coarse gate: redirects to `/admin/login` if there's no session cookie.
  This is a UX convenience, **not** the security boundary.
- `src/app/(admin)/admin/(protected)/layout.tsx` — the real gate for every admin *page*:
  redirects to login if there's no valid session.
- **Every admin Server Action and Route Handler calls `requireRole()`** (see
  `src/lib/auth/guards.ts`) as its first statement — this is the actual authorization check,
  since Next.js Server Functions are not covered by `proxy.ts` (see the code comments in
  `src/proxy.ts` for why).

### 4.2 How to create the first admin user

There is no sign-up page — by design, this is a single-admin tool. The first user is created
by the seed script:

```bash
# .env
ADMIN_EMAIL="alan@example.com"
# ADMIN_INITIAL_PASSWORD="choose-a-strong-password"   # optional — omit to auto-generate

npm run db:seed
```

If `ADMIN_INITIAL_PASSWORD` is omitted, a random password is generated and printed **once**
in the terminal — copy it immediately, then log in and note it down somewhere safe (there is
no password recovery flow yet; to reset, update `User.passwordHash` directly in the database
using a bcrypt hash, or re-run the seed after deleting the user row).

To add a second user (e.g. an `EDITOR`), do it via Prisma Studio (`npm run db:studio`) for
now — there's no "invite user" screen in v1.

### 4.3 How to log in

Go to `/admin/login`, enter the email/password from §4.2. Sessions are JWT-based (no
"remember me" beyond the browser's normal cookie lifetime).

### 4.4 How to edit content

Every public-facing section has a corresponding admin screen:

| Admin screen | URL | Controls |
| --- | --- | --- |
| Dashboard | `/admin` | Quick actions, at-a-glance counts, next show |
| Página inicial | `/admin/homepage` | Hero (headline, image, CTAs, WebGL toggle) + Biography (Press Kit text) |
| Carreira | `/admin/career` | Timeline milestones + World Stages (tabs) |
| Música | `/admin/releases` | Releases (title, cover, streaming links) |
| Agenda | `/admin/shows` | Shows (Upcoming/Past tabs, date-driven — no manual flag) |
| Galeria | `/admin/gallery` | Upload, drag-to-reorder, alt/caption, publish toggle |
| Imprensa | `/admin/press` | Press mentions |
| Biblioteca de mídia | `/admin/media` | Browse/search/delete every uploaded file |
| Booking | `/admin/booking` | Section copy + the inbox of submitted booking requests |
| SEO | `/admin/seo` | Title/description with character counters, share image, indexability |
| Ajustes | `/admin/settings` | Artist identity (name, roles, bio, start year) + social links |

Content types with a **Publicar** toggle (Timeline, World Stages, Releases, Shows, Gallery,
Press) only appear on the public site once published — draft items are saved but hidden.
Saving anywhere triggers `revalidateTag`/`revalidatePath` for just that content type, so the
public site updates within seconds without a redeploy.

**Not in the admin (intentionally):** the Statement section's lines ("From Minas to the
World."), the Narrative Transition sequence's lines, and the Experience section's captions
are treated as fixed art-directed copy, not editable facts — changing them risks breaking
the hand-tuned GSAP timing and dilutes the "approved design" the brief asks to preserve. Their
database tables exist (for future extensibility) but have no CRUD screen yet.

### 4.5 How to add a show

`/admin/shows` → **+ Novo show** → fill in date/city/venue (the only required fields;
country defaults to "Brasil") → toggle **Publicar imediatamente** → **Salvar show**. The
public site automatically sorts it into Upcoming (chronological) and later moves it to Past
once its date passes — no manual step.

### 4.6 How to add a release

`/admin/releases` → **+ Novo lançamento** → choose a cover via the image picker, fill in
title/year/type, optionally add Spotify/Apple Music/YouTube links → **Salvar lançamento**.
With zero published releases, the public Music section shows a "follow on streaming" state
instead of an empty page (driven by the social links in Ajustes).

### 4.7 How to change social links

`/admin/settings` → **Redes sociais** → fill in the URL for a platform and save — it's
marked "configured" automatically and goes live. Leaving a platform's URL empty keeps it in
the disabled "coming soon" state on the public site rather than showing a broken link.

### 4.8 How to configure the booking form

- **Section copy** (title, intro text, notification email): `/admin/booking`.
- **Submitted requests**: same page, "Pedidos recebidos" — status can be updated
  (Novo/Lido/Respondido/Arquivado) and entries can be deleted.
- **Form fields themselves** (name, WhatsApp, city, etc.) are intentionally fixed — the admin
  UX explicitly does not let a non-technical user reshape a form schema; a developer changes
  `src/lib/validations/booking.ts` + `src/sections/Booking.tsx` for that.
- **Email/CRM notification on submit**: not wired up yet. `src/app/api/booking/route.ts`
  already persists every submission to the database (visible in the inbox above); add the
  actual send where the `TODO` comment is once a provider (Resend, SMTP, a CRM webhook) is
  chosen.
- The public form has basic spam protection: a honeypot field and a per-IP rate limit (5
  submissions/hour), see `src/app/api/booking/route.ts`.

### 4.9 Media Library, uploads and image picker

Anywhere a form needs an image, click **+ Escolher imagem** — this opens the Media Library in
a modal: pick an existing file, or **Enviar novo arquivo** / drag-and-drop a new one. Accepted
formats: JPG, PNG, WEBP, AVIF (SVG is intentionally not accepted — see §4.11). Max size: 15MB.

`/admin/media` is the standalone library: search, filter by category, copy a file's public
URL, or delete it. **Deleting a file that's in use is blocked**, not just warned — the error
names every place it's used (Hero, a specific Gallery photo, etc.); remove it from those
places first.

### 4.10 Where uploads actually live (storage architecture)

This matters because it was a deliberate architectural decision, not a default:

- **Hosting is Vercel (serverless)** → the application filesystem is **ephemeral**. Anything
  written to local disk during a request is gone by the next deploy or the next cold start.
  Writing uploads to a local `uploads/` folder in production would silently lose every file
  Alan ever uploads.
- **Therefore, production storage is Supabase Storage**, bucket **`uploads`**, with the exact
  folder structure requested — `uploads/hero/`, `uploads/gallery/`, `uploads/press/`,
  `uploads/releases/`, `uploads/shows/`, `uploads/general/` (plus `story/`, `stages/`,
  `narrative/`, `experience/`, `presskit/` for the sections that need their own images) —
  realized as **object-storage folders** inside that bucket, since there's no real
  "filesystem directory" to speak of in this environment.
- **The app never depends on Supabase directly outside one place.** Every upload/delete goes
  through the `StorageProvider` interface (`src/lib/storage/types.ts`):
  ```ts
  interface StorageProvider {
    createUploadTicket(input): Promise<UploadTicket>;
    head(path): Promise<HeadResult>;
    getPublicUrl(path): string;
    delete(paths): Promise<void>;
  }
  ```
  `src/lib/storage/supabase.ts` is the production implementation.
  `src/lib/storage/local.ts` is a **dev-only** fallback that writes to `public/uploads/` —
  it deliberately throws if `NODE_ENV === "production"`, so it can never accidentally become
  the active provider on a real deploy. `src/lib/storage/index.ts` is the single switch
  between them.
- **Uploads bypass Vercel's request-body limits.** The browser uploads bytes *directly* to
  Supabase Storage using a short-lived signed URL (`POST /api/admin/uploads/sign` issues the
  ticket; the file itself never passes through a Vercel serverless function). After the
  upload, a Server Action (`registerUploadedMedia`) re-verifies the file server-side —
  real size, and real file-type sniffing from the actual bytes (never the browser's declared
  `Content-Type`) — before creating the database record. See §4.11 for why this matters.
- **To switch to a different provider later** (S3, Cloudflare R2, Supabase's own storage
  replaced by something else): implement `StorageProvider` once, swap the export in
  `src/lib/storage/index.ts`. No admin screen or Server Action needs to change — they only
  ever call `storage.xxx()`, never a provider's SDK directly.

### 4.11 Security notes worth knowing

- **File type is never trusted from the client.** `registerUploadedMedia`
  (`src/app/(admin)/admin/_actions/media.ts`) fetches a small byte range of the just-uploaded
  file and sniffs its real magic bytes (`file-type` package) against an allowlist; a
  mismatched or disallowed file is rejected and deleted from storage, even if the original
  upload request claimed a valid `Content-Type`.
- **Filenames are never trusted for storage paths.** Every uploaded file gets a
  server-generated path (`src/lib/storage/paths.ts`): `folder/yyyy/mm/<uuid>-<slug>.<ext>` —
  the original filename only contributes a cosmetic, sanitized slug suffix.
- **SVG uploads are rejected entirely** (not sanitized) — safely allowing user-uploaded SVG
  requires server-side sanitization against embedded scripts/event handlers, which is out of
  scope for v1. If this is needed later, add a real sanitizer (e.g. server-side DOMPurify) —
  don't just add `image/svg+xml` to the allowlist.
- **Passwords** are hashed with `bcryptjs` (pure JS, no native build step) — never stored in
  plaintext, never logged. Repeated failed logins lock the account for 15 minutes after 5
  attempts (`User.failedLoginAttempts`/`lockedUntil` in the schema).
- **Draft content never reaches the public bundle.** Every public content getter
  (`src/lib/content/*.ts`) filters `status = PUBLISHED` at the database query level — draft
  rows are never fetched for the public site in the first place, not just hidden client-side.

### 4.12 Backup

Two things need backing up — **losing only one is still data loss**:

1. **Database** (Supabase Postgres) — Supabase takes automatic daily backups on paid plans;
   for extra safety, `pg_dump` the database periodically and store it somewhere else too.
2. **Uploads** (Supabase Storage, bucket `uploads`) — not covered by a Postgres backup. Use
   `supabase storage` CLI commands or the dashboard to export the bucket periodically, or
   mirror it to a second bucket/provider.

**To restore:** restore the Postgres dump first, then restore the Storage bucket contents —
the `Media.path`/`Media.url` values in the database must match real objects in storage, or
the "in use" checks and public images will point at nothing.

---

## 5. Database setup

### 5.1 Provisioning

This project targets **Supabase Postgres**. Create a project at
[supabase.com](https://supabase.com), then from **Project Settings → Database**, copy:

- The **pooled** connection string (Supavisor/PgBouncer, port `6543`) → `DATABASE_URL`.
  Must include `?pgbouncer=true&connection_limit=1` — required on Vercel serverless, where
  every function invocation can be its own connection; without pooling you'll exhaust
  Postgres's connection limit quickly.
- The **direct** connection string (port `5432`) → `DIRECT_URL`. Used only by the Prisma CLI
  (migrations, `db:studio`), never by the deployed app.

### 5.2 Schema & migrations

```bash
npm run db:migrate   # prisma migrate dev — local development
npm run db:deploy    # prisma migrate deploy — production/CI
npm run db:studio    # visual DB browser
npm run db:seed      # migrate original static content + create the first admin user
```

The schema (`prisma/schema.prisma`) uses Prisma 7's `prisma-client` generator (TypeScript
output, no Rust engine) via the `@prisma/adapter-pg` driver adapter — connection URLs live in
`prisma.config.ts` (CLI) and `src/lib/db.ts` (runtime), **not** in `schema.prisma` itself
(a Prisma 7 change).

### 5.3 Environment variables

See `.env.example` for the full annotated list. Summary:

| Variable | Used for |
| --- | --- |
| `DATABASE_URL` | Runtime DB connection (pooled) |
| `DIRECT_URL` | Prisma CLI (migrations) |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client-side upload PUT to Supabase Storage |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only — signs/deletes storage objects |
| `AUTH_SECRET`, `AUTH_TRUST_HOST` | Auth.js session encryption |
| `NEXT_PUBLIC_SITE_URL` | Metadata, OG, sitemap, robots, Auth.js callback URLs |
| `REVALIDATE_SECRET` | Guards `POST /api/revalidate` (manual full cache refresh) |
| `ADMIN_EMAIL`, `ADMIN_INITIAL_PASSWORD` | First admin user, `npm run db:seed` only |

---

## 6. Where to put photos / videos

- Upload through the admin (§4.9) — this is the intended path for anything the public site
  should show, since it also captures real dimensions (no layout shift) and generates a
  Media record.
- The `public/images/placeholder-*.png` files are locally generated gradient placeholders
  (via `node scripts/generate-placeholders.mjs`, safe to delete once no longer referenced) —
  they're the seed data's images and the code-level fallbacks (e.g. `WorldStages.tsx` falls
  back to `placeholder-stage.png` if a stage's `imageUrl` is ever null). Once real photos are
  uploaded through the admin for every stage/milestone/etc., these fallbacks simply never
  trigger.
- **Hero video**: upload via `/admin/homepage` is not built for video yet — the `Hero.videoId`
  field exists in the schema for a future admin upload, but today set it directly via Prisma
  Studio pointing at a `Media` row with `kind: VIDEO`, or leave it unset (the Hero image stays
  the LCP element and sole background either way).

---

## 7. Deploy

1. Push to a Git repository connected to Vercel.
2. Set every variable from §5.3 in Vercel's Project Settings → Environment Variables.
3. Vercel runs `npm install` (triggering `prisma generate`) then `npm run build` automatically.
4. Run `npm run db:deploy` (from CI or locally, pointed at the production `DIRECT_URL`) before
   or right after the first deploy, so the schema exists before the app queries it.
5. Run `npm run db:seed` once against production to create the first admin user and migrate
   the original static content (safe to re-run — every write is an upsert).

---

## Project structure

```
src/
  app/
    layout.tsx        true root — fonts only, no theme/providers
    (site)/            public site: layout (theme+motion providers), page, OG images
    (admin)/admin/     admin panel
      login/           public login page + its Server Action
      (protected)/      every other admin screen, behind the session guard
      _actions/         Server Actions, one file per content domain
    api/               booking, Auth.js handler, uploads sign, local-dev PUT, revalidate
    sitemap.ts robots.ts
  components/          shared public-site UI (Header, Footer, Preloader, cursor, three/)
  components/admin/    shared admin UI primitives (form fields, media picker, etc.)
  sections/            one component per home-page section (all now take props, not imports)
  hooks/               useMediaQuery, usePrefersReducedMotion, useInView, useAppReady
  lib/
    content/            cached, public data-access layer (Prisma → DTO), one file per section
    storage/            StorageProvider abstraction (Supabase/local)
    auth/               Auth.js config, guards, password hashing
    validations/         Zod schemas (public form + one per admin content type)
    db.ts gsap.ts structuredData.ts analytics.ts
  types/               shared content DTOs + next-auth module augmentation
  generated/prisma/    generated Prisma Client (gitignored, regenerated via `prisma generate`)
prisma/
  schema.prisma
  seed.ts seedStorage.ts   seed script + its upload helper
  seed-data/                original static content, used only by the seed script
```

## Motion & animation infrastructure

- **Lenis + GSAP** are wired once in `src/components/SmoothScrollProvider.tsx`: a single
  GSAP ticker drives both Lenis' `raf` loop and every `ScrollTrigger`, avoiding duplicate
  RAF loops or desynced triggers. Also calls `ScrollTrigger.refresh()` after `window.load`
  and `document.fonts.ready`, since content now arrives from the CMS and can shift layout
  slightly after late-loading images/fonts settle.
- **`@gsap/react`'s `useGSAP`** is used throughout instead of raw `useEffect` for GSAP code —
  it scopes selectors and automatically reverts tweens/ScrollTriggers on unmount or
  dependency change.
- **`prefers-reduced-motion`** is respected everywhere motion-heavy code runs: Lenis is
  skipped, pinned/scrubbed sequences are replaced with static or simple-fade equivalents, and
  the Hero's WebGL layer is not mounted.
- **Mobile** gets a deliberately different experience, not a shrunk desktop one: the Story
  timeline swaps from a pinned horizontal scroll to a vertical list (also automatically below
  3 milestones, regardless of viewport), WebGL never loads below `lg`, and pinned sequences
  are reduced.
- **Every section guards against CMS-driven edge cases**: zero items, one item, and unusually
  long lists are all handled explicitly (e.g. Story's pinned distance is clamped and the pin
  is skipped entirely below a minimum content length; NarrativeTransition's pinned height is
  computed from the actual line count, never hardcoded).

## The one WebGL experience

The Hero (`src/components/three/HeroCanvas.tsx`) has the site's only Three.js/React Three
Fiber canvas: a fullscreen plane sampling the hero photo with a subtle mouse-reactive
ripple + hairline chromatic split. It's a progressive-enhancement layer over the real
`next/image` underneath (which remains the actual LCP element) — desktop + fine pointer +
no reduced-motion only, capped device pixel ratio, paused (`frameloop="never"`) when the Hero
scrolls out of view, and routed through Next's own image optimizer (`/_next/image?...`) so
the WebGL texture fetch is same-origin even once the source is a Supabase Storage URL.

## SEO

- Metadata API (`src/app/(site)/layout.tsx generateMetadata()`): reads `SeoSettings` (with
  `SiteSettings` as fallback) — title, description, canonical, Open Graph, Twitter card,
  robots index/follow, all admin-editable at `/admin/seo`.
- `opengraph-image.tsx` / `twitter-image.tsx` generate the branded social preview image on
  the fly with `next/og`, unless a custom image is uploaded in `/admin/seo`, which takes
  precedence automatically.
- `src/app/sitemap.ts` / `robots.ts` — file-convention routes; `robots.ts` hardcodes
  `disallow: ["/api/", "/admin"]` (not admin-editable, by design — see §4.11's philosophy on
  what a non-technical user should never be able to accidentally break).
- Structured data (`src/lib/structuredData.ts`): `Person` schema always, `Event` schema only
  for real, published, non-cancelled shows (nothing is inferred or invented).

## Analytics

No analytics provider is wired up. `src/lib/analytics.ts` exports a single `track()`
function called at the key moments listed in the brief (`hero_booking_click`,
`booking_open`, `booking_submit`, `spotify_click`, `instagram_click`, `press_click`,
`show_click`) — plug a provider (GA4, Plausible, Meta Pixel, etc.) into that one file.

## Known placeholders to replace before launch

- All `public/images/placeholder-*.png` files (generated gradients, not real photography) —
  replace by uploading real photos through the admin for Hero, Story milestones, World
  Stages, the Experience grid, and the Narrative Transition background.
- Social links, releases, shows and press — all start empty/unconfigured by design (see the
  original brief's "no invented content" rule) — fill them in via the admin.
- `SiteSettings.bioFull` (Ajustes → Identidade / Página inicial → Biografia) — seeded from the
  original draft bio, marked for final artist approval.
