import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { StorageProvider, UploadTicket, HeadResult, CreateUploadTicketInput } from "./types";

const BUCKET = "uploads";

function getClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  }
  // Server-only client with the service role key — bypasses RLS, so every
  // call site MUST already be behind requireRole() (see src/lib/auth/guards.ts).
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

/**
 * Production storage: Supabase Storage, bucket "uploads" — subfolders
 * (hero/gallery/press/releases/shows/general/...) mirror the requested
 * `/uploads/<category>` structure, realized as object-storage folders since
 * Vercel's serverless filesystem is not persistent (see README > "CMS / Admin").
 */
export const supabaseStorage: StorageProvider = {
  async createUploadTicket({ path }: CreateUploadTicketInput): Promise<UploadTicket> {
    const client = getClient();
    const { data, error } = await client.storage.from(BUCKET).createSignedUploadUrl(path);
    if (error || !data) throw new Error(`Failed to create upload ticket: ${error?.message}`);

    return {
      provider: "supabase",
      path,
      token: data.token,
      signedUrl: data.signedUrl,
      maxBytes: 0, // enforced by the caller (registerUploadedMedia re-checks via head())
      expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // Supabase signed upload URLs are valid 2h
    };
  },

  async head(path: string): Promise<HeadResult> {
    const client = getClient();
    const lastSlash = path.lastIndexOf("/");
    const folder = lastSlash === -1 ? "" : path.slice(0, lastSlash);
    const filename = lastSlash === -1 ? path : path.slice(lastSlash + 1);

    const { data, error } = await client.storage.from(BUCKET).list(folder, { search: filename, limit: 1 });
    if (error || !data || data.length === 0) return { exists: false, sizeBytes: 0, mimeType: null };

    const entry = data[0];
    return {
      exists: true,
      sizeBytes: entry.metadata?.size ?? 0,
      mimeType: entry.metadata?.mimetype ?? null,
    };
  },

  async readHeadBytes(path: string, maxBytes: number): Promise<Buffer | null> {
    const publicUrl = supabaseStorage.getPublicUrl(path);
    const response = await fetch(publicUrl, { headers: { Range: `bytes=0-${maxBytes}` } }).catch(() => null);
    if (!response || !response.ok) return null;
    return Buffer.from(await response.arrayBuffer());
  },

  getPublicUrl(path: string): string {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!url) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL.");
    return `${url}/storage/v1/object/public/${BUCKET}/${path}`;
  },

  async delete(paths: string[]): Promise<void> {
    if (paths.length === 0) return;
    const client = getClient();
    const { error } = await client.storage.from(BUCKET).remove(paths);
    if (error) throw new Error(`Failed to delete storage objects: ${error.message}`);
  },
};
