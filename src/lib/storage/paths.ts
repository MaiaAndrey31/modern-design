import { randomUUID } from "node:crypto";

const EXTENSION_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "video/mp4": "mp4",
};

/** Never trusts the client-provided filename for the actual storage path — only for a readable, slugified suffix. */
export function buildStoragePath(folder: string, originalFilename: string, mimeType: string): string {
  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");

  const baseName = originalFilename.replace(/\.[^./\\]+$/, "");
  const slug = baseName
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);

  const extension = EXTENSION_BY_MIME[mimeType] ?? "bin";
  const id = randomUUID();

  return `${folder}/${yyyy}/${mm}/${id}${slug ? `-${slug}` : ""}.${extension}`;
}
