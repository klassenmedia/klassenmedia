import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { requireWorkspace } from "@/lib/auth";
import { db } from "@/lib/db";

// Bild-Upload (Phase 1: lokales Dateisystem; Cloud-Deploy nutzt später S3/R2).
// Sicherheit: Auth-Pflicht, MIME-Whitelist, Größenlimit, zufälliger Dateiname
// (nie der Original-Name → keine Path-Traversal-/Overwrite-Spielchen).

const ALLOWED: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};
const MAX_BYTES = 8 * 1024 * 1024;

export async function POST(request: Request) {
  let workspaceId: string;
  try {
    workspaceId = (await requireWorkspace()).workspace.id;
  } catch {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Keine Datei erhalten" }, { status: 400 });
  }

  const ext = ALLOWED[file.type];
  if (!ext) {
    return NextResponse.json(
      { error: "Nur JPG, PNG, WebP oder GIF erlaubt" },
      { status: 415 }
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Datei größer als 8 MB" }, { status: 413 });
  }

  const name = `${randomBytes(12).toString("hex")}.${ext}`;
  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()));

  const asset = await db.mediaAsset.create({
    data: { workspaceId, url: `/uploads/${name}`, kind: "image", source: "upload" },
  });

  return NextResponse.json({ id: asset.id, url: asset.url });
}
