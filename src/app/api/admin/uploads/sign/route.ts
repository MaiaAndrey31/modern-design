import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/guards";
import { storage } from "@/lib/storage";
import { buildStoragePath } from "@/lib/storage/paths";
import { signUploadSchema } from "@/lib/validations/media";

export async function POST(request: Request) {
  await requireRole(["ADMIN", "EDITOR"]);

  const body = await request.json().catch(() => null);
  const parsed = signUploadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, errors: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { filename, contentType, folder, sizeBytes } = parsed.data;
  const path = buildStoragePath(folder, filename, contentType);

  const ticket = await storage.createUploadTicket({ path, contentType, maxBytes: sizeBytes });

  return NextResponse.json({ ok: true, ...ticket });
}
