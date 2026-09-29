"use client";

import { createClient } from "@supabase/supabase-js";

// Browser-side client — public anon key only (never the service role key).
// Used exclusively to PUT already-signed upload URLs; every other storage
// operation (sign, delete, usage checks) happens server-side.
export function getSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) throw new Error("Missing Supabase public env vars.");
  return createClient(url, anonKey);
}
