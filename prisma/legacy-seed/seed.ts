/**
 * Seeds the database from the original static content (prisma/seed-data/*,
 * copied verbatim from the pre-CMS src/data/*.ts files) and creates the
 * first admin user. Safe to re-run — every write is an upsert.
 *
 * Usage: npm run db:seed
 * Env: ADMIN_EMAIL (required), ADMIN_INITIAL_PASSWORD (optional — a random
 * one is generated and printed once if omitted).
 */
import "dotenv/config";
import { randomBytes } from "node:crypto";
import { join } from "node:path";
import { stat } from "node:fs/promises";
import sharp from "sharp";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, type SocialPlatform } from "../src/generated/prisma/client";
import { seedUploadImage } from "./seedStorage";

// A dedicated client, not src/lib/db.ts's singleton — that file imports
// "server-only", which throws outside Next's bundler (this script runs
// under plain `tsx`/Node).
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

import { artist } from "./seed-data/artist";
import { timeline } from "./seed-data/timeline";
import { worldStages } from "./seed-data/worldStages";
import { gallery } from "./seed-data/gallery";
import { socialLinks } from "./seed-data/social";

const IMAGES_DIR = join(process.cwd(), "public", "images");
const mediaCache = new Map<string, { id: string; url: string }>();

async function seedImage(filename: string, folder: string): Promise<{ id: string; url: string }> {
  const cacheKey = `${folder}/${filename}`;
  const cached = mediaCache.get(cacheKey);
  if (cached) return cached;

  const localPath = join(IMAGES_DIR, filename);
  // sharp's metadata() does not include file size when reading from a path
  // (only width/height/format/etc.) — read it separately via fs.stat.
  const [metadata, stats] = await Promise.all([sharp(localPath).metadata(), stat(localPath)]);
  const storagePath = `${folder}/seed-${filename}`;
  const url = await seedUploadImage(localPath, storagePath, "image/png");

  const media = await prisma.media.upsert({
    where: { path: storagePath },
    create: {
      bucket: "uploads",
      path: storagePath,
      url,
      mimeType: "image/png",
      sizeBytes: stats.size,
      width: metadata.width ?? 1200,
      height: metadata.height ?? 1200,
      folder,
      alt: `${artist.name} — placeholder`,
    },
    update: { url, sizeBytes: stats.size, width: metadata.width ?? 1200, height: metadata.height ?? 1200 },
  });

  const result = { id: media.id, url: media.url };
  mediaCache.set(cacheKey, result);
  return result;
}

async function seedAdminUser() {
  const email = process.env.ADMIN_EMAIL;
  if (!email) {
    console.warn("⚠ ADMIN_EMAIL not set — skipping admin user creation. Set it and re-run to create one.");
    return;
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.info(`✓ Admin user already exists: ${email}`);
    return;
  }

  const password = process.env.ADMIN_INITIAL_PASSWORD ?? randomBytes(9).toString("base64url");
  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.create({
    data: { email, passwordHash, role: "ADMIN", name: "Alan Saher" },
  });

  console.info("✓ Created admin user:");
  console.info(`  email: ${email}`);
  if (!process.env.ADMIN_INITIAL_PASSWORD) {
    console.info(`  password (generated, shown once): ${password}`);
    console.info("  → change it after first login.");
  }
}

async function main() {
  await seedAdminUser();

  const heroImage = await seedImage("placeholder-hero.png", "hero");
  const storyImage = await seedImage("placeholder-story.png", "story");
  const stageImage = await seedImage("placeholder-stage.png", "stages");
  const transitionImage = await seedImage("placeholder-transition.png", "narrative");

  await prisma.siteSettings.upsert({
    where: { id: "singleton" },
    create: {
      id: "singleton",
      artistName: artist.name,
      roles: [...artist.roles],
      startYear: artist.startYear,
      tagline: artist.tagline,
      originStatement: artist.originStatement,
      signaturePhrase: artist.signaturePhrase,
      bioShort: artist.bioShort,
      bioFull: artist.bioFull,
    },
    update: {},
  });

  await prisma.hero.upsert({
    where: { id: "singleton" },
    create: { id: "singleton", headlineLines: ["Alan", "Saher"], backgroundImageId: heroImage.id },
    update: {},
  });

  await prisma.statementSection.upsert({ where: { id: "singleton" }, create: { id: "singleton" }, update: {} });
  await prisma.storyContent.upsert({ where: { id: "singleton" }, create: { id: "singleton" }, update: {} });
  await prisma.experienceSection.upsert({ where: { id: "singleton" }, create: { id: "singleton" }, update: {} });

  await prisma.narrativeSection.upsert({
    where: { id: "singleton" },
    create: { id: "singleton", backgroundImageId: transitionImage.id },
    update: {},
  });

  await prisma.pressKit.upsert({ where: { id: "singleton" }, create: { id: "singleton" }, update: {} });

  await prisma.bookingSettings.upsert({
    where: { id: "singleton" },
    create: {
      id: "singleton",
      intro:
        "Festivals, private events, brand activations and more — tell us about your event and the team will get back to you.",
    },
    update: {},
  });

  await prisma.seoSettings.upsert({
    where: { id: "singleton" },
    create: { id: "singleton", metaTitle: `${artist.name} — The Experience`, metaDescription: artist.bioShort },
    update: {},
  });

  // Timeline
  for (const [index, item] of timeline.entries()) {
    const existing = await prisma.timelineEvent.findFirst({ where: { yearLabel: item.year, title: item.title } });
    if (existing) continue;
    await prisma.timelineEvent.create({
      data: {
        yearLabel: item.year,
        title: item.title,
        subtitle: item.subtitle ?? null,
        description: item.description,
        imageId: storyImage.id,
        sortOrder: index,
        status: "PUBLISHED",
      },
    });
  }

  // World Stages
  for (const [index, stage] of worldStages.entries()) {
    const existing = await prisma.worldStage.findFirst({ where: { yearLabel: stage.year, title: stage.title } });
    if (existing) continue;
    await prisma.worldStage.create({
      data: {
        yearLabel: stage.year,
        title: stage.title,
        location: stage.location,
        description: stage.description,
        imageId: stageImage.id,
        showInNumbers: true,
        sortOrder: index,
        status: "PUBLISHED",
      },
    });
  }

  // Experience frames (fixed 4-slot grid)
  const experienceSlots: { slot: number; layout: "WIDE" | "TALL"; offsetPx: number; alt: string }[] = [
    { slot: 1, layout: "WIDE", offsetPx: 0, alt: "Crowd energy under stage lights" },
    { slot: 2, layout: "TALL", offsetPx: 64, alt: "Alan Saher behind the decks" },
    { slot: 3, layout: "TALL", offsetPx: -32, alt: "Backstage moment before a show" },
    { slot: 4, layout: "WIDE", offsetPx: 24, alt: "Stage lighting rig at full scale" },
  ];
  for (const frame of experienceSlots) {
    const media = await seedImage(`placeholder-experience-${frame.slot}.png`, "experience");
    await prisma.experienceFrame.upsert({
      where: { slot: frame.slot },
      create: { slot: frame.slot, layout: frame.layout, offsetPx: frame.offsetPx, alt: frame.alt, mediaId: media.id, status: "PUBLISHED" },
      update: {},
    });
  }

  // Gallery
  for (const [index, item] of gallery.entries()) {
    const filename = item.src.split("/").pop()!;
    const media = await seedImage(filename, "gallery");
    const existing = await prisma.galleryItem.findFirst({ where: { mediaId: media.id } });
    if (existing) continue;
    const orientation = item.orientation === "portrait" ? "PORTRAIT" : item.orientation === "square" ? "SQUARE" : "LANDSCAPE";
    await prisma.galleryItem.create({
      data: { mediaId: media.id, alt: item.alt, orientation, sortOrder: index, status: "PUBLISHED" },
    });
  }

  // Social links (all start unconfigured — no real URLs were provided)
  const platformMap: Record<string, SocialPlatform> = {
    instagram: "INSTAGRAM",
    spotify: "SPOTIFY",
    appleMusic: "APPLE_MUSIC",
    youtube: "YOUTUBE",
    tiktok: "TIKTOK",
    whatsapp: "WHATSAPP",
  };
  for (const link of socialLinks) {
    const platform = platformMap[link.platform];
    if (!platform) continue;
    await prisma.socialLink.upsert({
      where: { platform },
      create: { platform, label: link.label, url: link.url, isConfigured: link.configured },
      update: {},
    });
  }

  console.info("✓ Seed complete.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
