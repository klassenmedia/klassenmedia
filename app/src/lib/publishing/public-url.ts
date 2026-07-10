// Meta (und andere Plattformen) laden Medien selbst per URL — lokale
// Upload-Pfade brauchen deshalb die öffentliche App-Adresse (PUBLIC_APP_URL).
// Bewusst ohne "server-only", damit die Logik unit-testbar bleibt.

/**
 * Macht aus einer Medien-URL eine öffentlich ladbare Adresse.
 * null = kein ladbares Medium (Demo-Platzhalter).
 */
export function toPublicUrl(url: string, base = process.env.PUBLIC_APP_URL): string | null {
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith("placeholder:")) return null;
  if (!base) {
    throw new Error(
      "PUBLIC_APP_URL fehlt in .env — Meta lädt Medien per öffentlicher URL, " +
        "lokale Uploads brauchen dafür die Domain der App."
    );
  }
  return `${base.replace(/\/+$/, "")}${url.startsWith("/") ? url : `/${url}`}`;
}
