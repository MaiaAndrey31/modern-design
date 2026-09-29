import { NextResponse } from "next/server";
import { revalidateTag, revalidatePath } from "next/cache";
import { CACHE_TAGS } from "@/lib/content/tags";

/**
 * Manual "republish site" trigger — forces every cached content tag to
 * revalidate. Not used by the admin UI's normal save flow (each Server
 * Action already revalidates its own tag precisely); this exists for a
 * manual full-refresh (e.g. after a direct DB edit) or an external webhook.
 * Guarded by a shared secret header, never a session — callers may not have
 * a browser session (cron, webhook).
 */
export async function POST(request: Request) {
  const secret = request.headers.get("x-revalidate-secret");
  if (!secret || secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  revalidateTag(CACHE_TAGS.all, { expire: 0 });
  revalidatePath("/");

  return NextResponse.json({ ok: true });
}
