import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { uploadsDir } from "@/lib/uploads";

// Liefert hochgeladene Bilder aus dem (evtl. auf einem Volume liegenden)
// Uploads-Verzeichnis aus. Sicherheit: nur Bild-Endungen, keine Path-Traversal
// (aufgelöster Pfad muss im Uploads-Verzeichnis liegen).

const TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await params;
  const dir = path.resolve(uploadsDir());
  const target = path.resolve(dir, ...segments);

  // Path-Traversal verhindern
  if (target !== dir && !target.startsWith(dir + path.sep)) {
    return new NextResponse("Nicht gefunden", { status: 404 });
  }

  const type = TYPES[path.extname(target).toLowerCase()];
  if (!type) return new NextResponse("Nicht gefunden", { status: 404 });

  try {
    const data = await readFile(target);
    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type": type,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("Nicht gefunden", { status: 404 });
  }
}
