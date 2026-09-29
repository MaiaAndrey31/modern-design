"use server";

import { fileTypeFromBuffer } from "file-type";
import { updateTag, revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { storage } from "@/lib/storage";
import { CACHE_TAGS } from "@/lib/content/tags";
import { getMediaUsage } from "@/lib/content/media";
import { registerMediaSchema, updateMediaMetaSchema, ALLOWED_IMAGE_MIME_TYPES, ALLOWED_VIDEO_MIME_TYPES, isVideoMime, maxBytesFor } from "@/lib/validations/media";

type ActionResult = { ok: true; id: string; url: string } | { ok: false; error: string };

/**
 * Runs AFTER the browser has already PUT the file's bytes directly to
 * Supabase Storage (bypassing Vercel's body-size limits). This is the real
 * security checkpoint: it re-verifies the object actually exists, re-checks
 * its real size, and sniffs its true magic bytes — never trusting the
 * client's declared Content-Type — before creating the Media row.
 */
export async function registerUploadedMedia(input: unknown): Promise<ActionResult> {
  const user = await requireRole(["ADMIN", "EDITOR"]);

  const parsed = registerMediaSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Dados inválidos." };
  const { path, mimeType: declaredMime, width, height, durationSec, alt, folder } = parsed.data;

  const head = await storage.head(path);
  if (!head.exists) return { ok: false, error: "Falha no envio — arquivo não encontrado." };

  // Sniff real magic bytes from the uploaded object — a spoofed
  // Content-Type header on the original PUT request is never trusted.
  const buffer = await storage.readHeadBytes(path, 4100);
  if (!buffer) {
    await storage.delete([path]);
    return { ok: false, error: "Não foi possível validar o arquivo enviado." };
  }
  const sniffed = await fileTypeFromBuffer(buffer);
  const publicUrl = storage.getPublicUrl(path);

  // The sniffed type must be in the same family (image vs video) the client
  // declared — an image-only field can never end up holding a video.
  const allowed: readonly string[] = isVideoMime(declaredMime) ? ALLOWED_VIDEO_MIME_TYPES : ALLOWED_IMAGE_MIME_TYPES;
  if (!sniffed || !allowed.includes(sniffed.mime)) {
    await storage.delete([path]);
    return { ok: false, error: "Tipo de arquivo não permitido." };
  }
  if (head.sizeBytes > maxBytesFor(sniffed.mime)) {
    await storage.delete([path]);
    return { ok: false, error: "Arquivo muito grande." };
  }

  const media = await prisma.media.create({
    data: {
      bucket: "uploads",
      path,
      url: publicUrl,
      kind: isVideoMime(sniffed.mime) ? "VIDEO" : "IMAGE",
      mimeType: sniffed.mime,
      sizeBytes: head.sizeBytes,
      width,
      height,
      durationSec: durationSec ?? null,
      alt: alt ?? null,
      folder,
      uploadedById: user.id,
    },
  });

  updateTag(CACHE_TAGS.media);
  return { ok: true, id: media.id, url: media.url };
}

export async function updateMediaMeta(id: string, input: unknown): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireRole(["ADMIN", "EDITOR"]);

  const parsed = updateMediaMetaSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Dados inválidos." };
  const { alt, title, folder } = parsed.data;

  const exists = await prisma.media.findUnique({ where: { id }, select: { id: true } });
  if (!exists) return { ok: false, error: "Arquivo não encontrado." };

  await prisma.media.update({ where: { id }, data: { alt: alt || null, title: title || null, folder } });
  // alt text is rendered on the public site wherever this image is used.
  updateTag(CACHE_TAGS.media);
  updateTag(CACHE_TAGS.all);
  revalidatePath("/");
  return { ok: true };
}

export async function deleteMedia(id: string): Promise<{ ok: boolean; error?: string; usedIn?: string[] }> {
  await requireRole(["ADMIN", "EDITOR"]);

  const usage = await getMediaUsage(id);
  if (usage.inUseCount > 0) {
    return { ok: false, error: "Esta imagem está em uso e não pode ser excluída.", usedIn: usage.usedIn };
  }

  const media = await prisma.media.findUnique({ where: { id } });
  if (!media) return { ok: true };

  await prisma.media.delete({ where: { id } });
  await storage.delete([media.path]);

  updateTag(CACHE_TAGS.media);
  return { ok: true };
}
