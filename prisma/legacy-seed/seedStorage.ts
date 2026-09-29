// Seed-only upload helper. Bypasses the presigned-URL flow used by the admin
// UI (that flow exists for untrusted browser uploads) — this script already
// runs with full trust, so it uploads directly via the Supabase admin client
// (or copies into public/uploads/ for local dev without real Supabase env
// vars configured yet).
import { readFile, mkdir, copyFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { createClient } from "@supabase/supabase-js";

const BUCKET = "uploads";

function hasRealSupabaseConfig(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return Boolean(url && key && !url.includes("placeholder") && !key.includes("placeholder"));
}

export async function seedUploadImage(localFilePath: string, storagePath: string, mimeType: string): Promise<string> {
  if (hasRealSupabaseConfig()) {
    const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
    const buffer = await readFile(localFilePath);
    const { error } = await client.storage.from(BUCKET).upload(storagePath, buffer, { contentType: mimeType, upsert: true });
    if (error) throw new Error(`Seed upload failed for ${storagePath}: ${error.message}`);
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${storagePath}`;
  }

  // Local dev fallback — mirrors src/lib/storage/local.ts's convention.
  // Relative URL: next/image treats any absolute URL as a remote host
  // requiring `images.remotePatterns`, even for the app's own origin.
  const uploadsRoot = join(process.cwd(), "public", "uploads");
  const destination = join(uploadsRoot, storagePath);
  await mkdir(dirname(destination), { recursive: true });
  await copyFile(localFilePath, destination);
  return `/uploads/${storagePath}`;
}
