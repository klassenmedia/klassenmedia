import "server-only";

import path from "path";

// Uploads liegen in einem konfigurierbaren Verzeichnis, damit sie in der Cloud
// auf eine persistente Platte (Volume) zeigen können. Lokal: <projekt>/uploads.
// Bewusst NICHT unter public/, weil Dateien dort nur zur Build-Zeit statisch
// ausgeliefert werden — zur Laufzeit hochgeladene Bilder serviert die Route
// /uploads/[...path].
export function uploadsDir(): string {
  return process.env.UPLOADS_DIR || path.join(process.cwd(), "uploads");
}
