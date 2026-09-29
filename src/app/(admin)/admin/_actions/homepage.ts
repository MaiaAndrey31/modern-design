"use server";

import { updateTag, revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { CACHE_TAGS } from "@/lib/content/tags";
import { SINGLETON_ID } from "@/lib/content/singleton";
import { isSectionKey } from "@/lib/sections/registry";
import { heroSchema, bioSchema, statementBackgroundSchema } from "@/lib/validations/admin/homepage";
import type { ActionState } from "@/lib/validations/admin/actionState";

export async function updateHeroAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireRole(["ADMIN", "EDITOR"]);

  const parsed = heroSchema.safeParse({
    headlineLine1: formData.get("headlineLine1") ?? "",
    headlineLine2: formData.get("headlineLine2") ?? "",
    eyebrowOverride: formData.get("eyebrowOverride") ?? "",
    primaryCtaLabel: formData.get("primaryCtaLabel") ?? "",
    primaryCtaTarget: formData.get("primaryCtaTarget") ?? "",
    secondaryCtaLabel: formData.get("secondaryCtaLabel") ?? "",
    secondaryCtaTarget: formData.get("secondaryCtaTarget") ?? "",
    enableWebgl: formData.get("enableWebgl") === "on",
    backgroundImageId: formData.get("backgroundImageId") ?? "",
    backgroundType: formData.get("backgroundType") ?? "image",
    videoId: formData.get("videoId") ?? "",
    youtubeUrl: formData.get("youtubeUrl") ?? "",
  });
  if (!parsed.success) return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  const data = parsed.data;
  // Only the selected background type is kept — switching back to "image"
  // clears the video/YouTube so the site never shows a stale one.
  const videoId = data.backgroundType === "video" ? data.videoId || null : null;
  const youtubeUrl = data.backgroundType === "youtube" ? data.youtubeUrl || null : null;

  // TEMPORARY (Phase 3 → 4): legacy single-language form → PT fields of
  // HeroSection; the eyebrow now lives on Section("hero").
  const ctaType = (target: string) => (isSectionKey(target) ? ("SECTION" as const) : ("ROUTE" as const));
  const heroData = {
    headlineLinesPt: [data.headlineLine1, data.headlineLine2].filter(Boolean),
    primaryCtaLabelPt: data.primaryCtaLabel,
    primaryCtaType: ctaType(data.primaryCtaTarget),
    primaryCtaTarget: data.primaryCtaTarget,
    secondaryCtaLabelPt: data.secondaryCtaLabel,
    secondaryCtaType: ctaType(data.secondaryCtaTarget),
    secondaryCtaTarget: data.secondaryCtaTarget,
    enableWebgl: data.enableWebgl ?? true,
    backgroundImageId: data.backgroundImageId || null,
    videoId,
    youtubeUrl,
  };
  await prisma.$transaction([
    prisma.heroSection.upsert({
      where: { id: SINGLETON_ID },
      create: { id: SINGLETON_ID, ...heroData },
      update: heroData,
    }),
    prisma.section.upsert({
      where: { key: "hero" },
      create: { key: "hero", sortOrder: 0, eyebrowPt: data.eyebrowOverride || null },
      update: { eyebrowPt: data.eyebrowOverride || null },
    }),
  ]);

  updateTag(CACHE_TAGS.hero);
  updateTag(CACHE_TAGS.sections);
  revalidatePath("/");
  return { ok: true };
}

export async function updateBioAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireRole(["ADMIN", "EDITOR"]);

  const parsed = bioSchema.safeParse({ bioFull: formData.get("bioFull") ?? "" });
  if (!parsed.success) return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };

  // TEMPORARY (Phase 3 → 4): the bio now lives on Profile (PT field).
  await prisma.profile.upsert({
    where: { id: SINGLETON_ID },
    create: { id: SINGLETON_ID, bioPt: parsed.data.bioFull },
    update: { bioPt: parsed.data.bioFull },
  });

  updateTag(CACHE_TAGS.profile);
  updateTag(CACHE_TAGS.presskit);
  revalidatePath("/");
  return { ok: true };
}

export async function updateStatementBackgroundAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireRole(["ADMIN", "EDITOR"]);

  const parsed = statementBackgroundSchema.safeParse({ backgroundImageId: formData.get("backgroundImageId") ?? "" });
  if (!parsed.success) return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  const backgroundImageId = parsed.data.backgroundImageId || null;

  if (backgroundImageId) {
    const media = await prisma.media.findUnique({ where: { id: backgroundImageId }, select: { kind: true } });
    if (!media || media.kind !== "IMAGE") return { ok: false, error: "Escolha uma imagem válida." };
  }

  // Lines/accent keep their schema defaults on first create — only the background is edited here.
  await prisma.statementSection.upsert({
    where: { id: SINGLETON_ID },
    create: { id: SINGLETON_ID, backgroundImageId },
    update: { backgroundImageId },
  });

  updateTag(CACHE_TAGS.statement);
  revalidatePath("/");
  return { ok: true };
}
