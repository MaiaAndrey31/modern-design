import "server-only";
import { access, mkdir, stat, unlink, open } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { StorageProvider, UploadTicket, HeadResult, CreateUploadTicketInput } from "./types";

const UPLOADS_ROOT = join(process.cwd(), "public", "uploads");

/**
 * Local-filesystem storage — DEV ONLY. Writes into public/uploads/ (served
 * directly by Next's static file handling). Vercel's production filesystem
 * is ephemeral, so this must never be the active provider in production —
 * see src/lib/storage/index.ts, which selects supabaseStorage whenever
 * NODE_ENV === "production".
 */
export const localStorage: StorageProvider = {
  async createUploadTicket({ path }: CreateUploadTicketInput): Promise<UploadTicket> {
    if (process.env.NODE_ENV === "production") {
      throw new Error("localStorage must never be used in production — Vercel's filesystem is not persistent.");
    }
    await mkdir(dirname(join(UPLOADS_ROOT, path)), { recursive: true });
    return {
      provider: "local",
      path,
      token: "local-dev",
      signedUrl: `/api/admin/uploads/local-put?path=${encodeURIComponent(path)}`,
      maxBytes: 0,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    };
  },

  async head(path: string): Promise<HeadResult> {
    const fullPath = join(UPLOADS_ROOT, path);
    try {
      await access(fullPath);
      const stats = await stat(fullPath);
      return { exists: true, sizeBytes: stats.size, mimeType: null };
    } catch {
      return { exists: false, sizeBytes: 0, mimeType: null };
    }
  },

  async readHeadBytes(path: string, maxBytes: number): Promise<Buffer | null> {
    const fullPath = join(UPLOADS_ROOT, path);
    try {
      const handle = await open(fullPath, "r");
      try {
        const buffer = Buffer.alloc(maxBytes);
        const { bytesRead } = await handle.read(buffer, 0, maxBytes, 0);
        return buffer.subarray(0, bytesRead);
      } finally {
        await handle.close();
      }
    } catch {
      return null;
    }
  },

  getPublicUrl(path: string): string {
    // Relative — served by Next's own static handling from public/uploads/.
    // Must NOT be absolute: next/image treats any absolute URL as a remote
    // host requiring `images.remotePatterns`, even for the app's own origin.
    return `/uploads/${path}`;
  },

  async delete(paths: string[]): Promise<void> {
    await Promise.all(
      paths.map(async (path) => {
        try {
          await unlink(join(UPLOADS_ROOT, path));
        } catch {
          // already gone — fine
        }
      })
    );
  },
};
