import "server-only";
import type { StorageProvider } from "./types";
import { supabaseStorage } from "./supabase";
import { localStorage } from "./local";

/**
 * The only place that decides which StorageProvider is active. Production
 * (Vercel, ephemeral filesystem) always uses Supabase Storage; local
 * filesystem storage is a dev-only convenience and refuses to run in
 * production (see src/lib/storage/local.ts).
 */
export const storage: StorageProvider =
  process.env.NODE_ENV === "production" || process.env.FORCE_SUPABASE_STORAGE === "true"
    ? supabaseStorage
    : localStorage;

export type { StorageProvider, UploadTicket, HeadResult, CreateUploadTicketInput } from "./types";
