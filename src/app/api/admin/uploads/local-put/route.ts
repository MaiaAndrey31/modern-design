import { NextResponse } from "next/server";
import { writeFile, mkdir } from "node:fs/promises";
import { dirname, join, normalize } from "node:path";
import { requireRole } from "@/lib/auth/guards";

const UPLOADS_ROOT = join(process.cwd(), "public", "uploads");

/**
 * Dev-only PUT target mirroring Supabase's `uploadToSignedUrl` contract, so
 * the same client-side upload code works against either provider. Never
 * active in production — src/lib/storage/local.ts refuses to issue tickets
 * there, so this route is unreachable in prod even if hit directly.
 */
export async function PUT(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ ok: false, error: "Not available in production" }, { status: 404 });
  }

  await requireRole(["ADMIN", "EDITOR"]);

  const path = new URL(request.url).searchParams.get("path");
  if (!path) return NextResponse.json({ ok: false, error: "Missing path" }, { status: 400 });

  // Reject any path that escapes the uploads root — never trust client input for filesystem writes.
  const target = normalize(join(UPLOADS_ROOT, path));
  if (!target.startsWith(UPLOADS_ROOT)) {
    return NextResponse.json({ ok: false, error: "Invalid path" }, { status: 400 });
  }

  const buffer = Buffer.from(await request.arrayBuffer());
  if (buffer.length === 0) return NextResponse.json({ ok: false, error: "Empty body" }, { status: 400 });

  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, buffer);

  return NextResponse.json({ ok: true });
}
