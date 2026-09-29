"use server";

import { updateTag, revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { CACHE_TAGS } from "@/lib/content/tags";
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

  await prisma.hero.upsert({
    where: { id: "singleton" },
    create: {
      id: "singleton",
      headlineLines: [data.headlineLine1, data.headlineLine2],
      eyebrowOverride: data.eyebrowOverride || null,
      primaryCtaLabel: data.primaryCtaLabel,
      primaryCtaTarget: data.primaryCtaTarget,
      secondaryCtaLabel: data.secondaryCtaLabel,
      secondaryCtaTarget: data.secondaryCtaTarget,
      enableWebgl: data.enableWebgl ?? true,
      backgroundImageId: data.backgroundImageId || null,
      videoId,
      youtubeUrl,
    },
    update: {
      headlineLines: [data.headlineLine1, data.headlineLine2],
      eyebrowOverride: data.eyebrowOverride || null,
      primaryCtaLabel: data.primaryCtaLabel,
      primaryCtaTarget: data.primaryCtaTarget,
      secondaryCtaLabel: data.secondaryCtaLabel,
      secondaryCtaTarget: data.secondaryCtaTarget,
      enableWebgl: data.enableWebgl ?? true,
      backgroundImageId: data.backgroundImageId || null,
      videoId,
      youtubeUrl,
    },
  });

  updateTag(CACHE_TAGS.hero);
  revalidatePath("/");
  return { ok: true };
}

export async function updateBioAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireRole(["ADMIN", "EDITOR"]);

  const parsed = bioSchema.safeParse({ bioFull: formData.get("bioFull") ?? "" });
  if (!parsed.success) return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };

  await prisma.siteSettings.upsert({
    where: { id: "singleton" },
    create: {
      id: "singleton",
      tagline: "30+ Years. One Sound. Thousands of Stories.",
      originStatement: "From Minas to the World.",
      bioShort: parsed.data.bioFull.slice(0, 200),
      bioFull: parsed.data.bioFull,
    },
    update: { bioFull: parsed.data.bioFull },
  });

  updateTag(CACHE_TAGS.site);
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
    where: { id: "singleton" },
    create: { id: "singleton", backgroundImageId },
    update: { backgroundImageId },
  });

  updateTag(CACHE_TAGS.statement);
  revalidatePath("/");
  return { ok: true };
}
