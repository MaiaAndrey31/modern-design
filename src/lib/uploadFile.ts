"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { registerUploadedMedia } from "@/app/(admin)/admin/_actions/media";
import {
  ALLOWED_IMAGE_MIME_TYPES,
  ALLOWED_VIDEO_MIME_TYPES,
  MAX_IMAGE_BYTES,
  MAX_VIDEO_BYTES,
} from "@/lib/validations/media";

export type UploadKind = "image" | "video";

export interface UploadResult {
  ok: boolean;
  mediaId?: string;
  url?: string;
  error?: string;
}

interface FileMetadata {
  width: number;
  height: number;
  durationSec?: number;
}

function readImageDimensions(file: File): Promise<FileMetadata> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Não foi possível ler a imagem."));
    };
    img.src = objectUrl;
  });
}

function readVideoMetadata(file: File): Promise<FileMetadata> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    const objectUrl = URL.createObjectURL(file);
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(objectUrl);
      if (!video.videoWidth || !video.videoHeight) return reject(new Error("no video track"));
      resolve({
        width: video.videoWidth,
        height: video.videoHeight,
        durationSec: Number.isFinite(video.duration) ? Math.round(video.duration) : undefined,
      });
    };
    video.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Não foi possível ler o vídeo."));
    };
    video.src = objectUrl;
  });
}

/** Client-side fast-feedback checks only — the real security boundary is server-side (see registerUploadedMedia). */
function validateClientSide(file: File, kind: UploadKind): string | null {
  const allowed: readonly string[] = kind === "video" ? ALLOWED_VIDEO_MIME_TYPES : ALLOWED_IMAGE_MIME_TYPES;
  const maxBytes = kind === "video" ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
  if (!allowed.includes(file.type)) {
    return kind === "video" ? "Formato não suportado. Use MP4." : "Formato não suportado. Use JPG, PNG, WEBP ou AVIF.";
  }
  if (file.size > maxBytes) {
    return `Arquivo muito grande (máx. ${Math.round(maxBytes / 1024 / 1024)}MB).`;
  }
  return null;
}

export async function uploadFile(
  file: File,
  folder: string,
  alt?: string,
  kind: UploadKind = "image"
): Promise<UploadResult> {
  const clientError = validateClientSide(file, kind);
  if (clientError) return { ok: false, error: clientError };

  let metadata: FileMetadata;
  try {
    metadata = kind === "video" ? await readVideoMetadata(file) : await readImageDimensions(file);
  } catch {
    return { ok: false, error: kind === "video" ? "Não foi possível ler o vídeo." : "Não foi possível ler a imagem." };
  }

  const signRes = await fetch("/api/admin/uploads/sign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filename: file.name, contentType: file.type, sizeBytes: file.size, folder }),
  });
  if (!signRes.ok) return { ok: false, error: "Falha ao preparar o envio." };
  const ticket = (await signRes.json()) as {
    ok: boolean;
    provider: "supabase" | "local";
    path: string;
    token: string;
    signedUrl: string;
  };

  if (ticket.provider === "supabase") {
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.storage.from("uploads").uploadToSignedUrl(ticket.path, ticket.token, file);
    if (error) return { ok: false, error: "Falha no envio do arquivo." };
  } else {
    const putRes = await fetch(ticket.signedUrl, { method: "PUT", body: file });
    if (!putRes.ok) return { ok: false, error: "Falha no envio do arquivo." };
  }

  const result = await registerUploadedMedia({
    path: ticket.path,
    mimeType: file.type,
    width: metadata.width,
    height: metadata.height,
    durationSec: metadata.durationSec,
    alt,
    folder,
  });

  if (!result.ok) return { ok: false, error: result.error };
  return { ok: true, mediaId: result.id, url: result.url };
}
