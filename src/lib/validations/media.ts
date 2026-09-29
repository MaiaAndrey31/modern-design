import { z } from "zod";
import { MEDIA_CATEGORIES, MEDIA_CATEGORY_LABELS, type MediaCategory } from "@/lib/media/categories";

// SVG deliberately excluded — accepting user-uploaded SVG safely requires
// server-side sanitization (embedded <script>/event-handler payloads); out
// of scope for v1, simplest-safe choice per the brief's own caution.
export const ALLOWED_IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"] as const;
export const MAX_IMAGE_BYTES = 15 * 1024 * 1024; // 15MB — generous for straight-off-camera photos

// MP4 only — the one format every browser plays in a <video> without fallbacks.
export const ALLOWED_VIDEO_MIME_TYPES = ["video/mp4"] as const;
// 50MB — Supabase Storage's default per-file limit on the free plan; also a
// sane ceiling for an autoplaying background loop.
export const MAX_VIDEO_BYTES = 50 * 1024 * 1024;

export const ALLOWED_UPLOAD_MIME_TYPES = [...ALLOWED_IMAGE_MIME_TYPES, ...ALLOWED_VIDEO_MIME_TYPES] as const;

export function isVideoMime(mime: string): boolean {
  return (ALLOWED_VIDEO_MIME_TYPES as readonly string[]).includes(mime);
}

export function maxBytesFor(mime: string): number {
  return isVideoMime(mime) ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
}

// Upload/library categories come from the registry (src/lib/media/categories.ts).
// The legacy admin UI still calls them "folders" — aliases kept until Phase 7.
export const MEDIA_FOLDERS = MEDIA_CATEGORIES;
export type MediaFolder = MediaCategory;
export const MEDIA_FOLDER_LABELS = MEDIA_CATEGORY_LABELS;

export const updateMediaMetaSchema = z.object({
  alt: z.string().trim().max(300),
  title: z.string().trim().max(200),
  folder: z.enum(MEDIA_FOLDERS),
});

export const signUploadSchema = z
  .object({
    filename: z.string().trim().min(1).max(255),
    contentType: z.enum(ALLOWED_UPLOAD_MIME_TYPES),
    sizeBytes: z.number().int().positive(),
    folder: z.enum(MEDIA_FOLDERS).default("general"),
  })
  .refine((v) => v.sizeBytes <= maxBytesFor(v.contentType), { path: ["sizeBytes"], message: "Arquivo muito grande." });

export const registerMediaSchema = z.object({
  path: z.string().trim().min(1),
  mimeType: z.enum(ALLOWED_UPLOAD_MIME_TYPES),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  durationSec: z.number().int().nonnegative().optional(),
  alt: z.string().trim().max(300).optional(),
  folder: z.enum(MEDIA_FOLDERS).default("general"),
});
