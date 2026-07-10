// Adapter-Pattern fürs Publishing: pro Plattform ein Adapter mit einheitlichem
// Interface. Solange keine Plattform-App-Credentials vorliegen (Meta App
// Review etc.), läuft alles über den Simulations-Adapter — derselbe Codepfad,
// nur ohne echten API-Call. Die echten Adapter docken hier an.

import { validateForPlatform } from "./rules";
import { decrypt } from "../crypto";

export interface PublishTarget {
  platform: string;
  handle: string;
  accessTokenEnc: string | null;
}

export interface PublishPost {
  body: string;
  format: string;
  mediaCount: number;
  title?: string | null;
}

export interface PublishResult {
  externalId: string;
}

export interface PublisherAdapter {
  publish(post: PublishPost, target: PublishTarget): Promise<PublishResult>;
}

/** Simulations-Adapter: validiert nach echten Plattformregeln und "veröffentlicht" lokal. */
const simulatedAdapter: PublisherAdapter = {
  async publish(post, target) {
    const error = validateForPlatform(post, target.platform);
    if (error) throw new Error(error);
    return { externalId: `sim_${Date.now()}_${Math.random().toString(36).slice(2, 8)}` };
  },
};

/** Platzhalter für die echten Adapter (Phase 2b, nach App-Review der Plattformen). */
function realAdapter(envVar: string): PublisherAdapter {
  return {
    async publish() {
      throw new Error(
        `Echte Veröffentlichung noch nicht konfiguriert (${envVar} fehlt). ` +
          "Developer-App der Plattform anlegen und Credentials in .env hinterlegen."
      );
    },
  };
}

/**
 * Echter WordPress-Adapter — anders als die Social-Plattformen kein App-Review
 * nötig: die Zugangsdaten (Website-URL + "Benutzer:Anwendungskennwort") liegen
 * direkt am Account, kein globaler Plattform-Key erforderlich.
 */
const wordpressAdapter: PublisherAdapter = {
  async publish(post, target) {
    const error = validateForPlatform(post, target.platform);
    if (error) throw new Error(error);
    if (!target.accessTokenEnc) {
      throw new Error(
        "WordPress-Zugangsdaten fehlen — im Account die Website-URL und das Anwendungskennwort hinterlegen."
      );
    }
    const credentials = decrypt(target.accessTokenEnc);
    const auth = Buffer.from(credentials).toString("base64");
    const url = `${target.handle.replace(/\/+$/, "")}/wp-json/wp/v2/posts`;

    let res: Response;
    try {
      res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title: post.title, content: post.body, status: "publish" }),
        signal: AbortSignal.timeout(15_000),
      });
    } catch {
      throw new Error(`WordPress unter ${target.handle} nicht erreichbar.`);
    }
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(`WordPress hat abgelehnt (${res.status}): ${detail.slice(0, 200)}`);
    }
    const data = (await res.json()) as { id: number | string };
    return { externalId: String(data.id) };
  },
};

const REAL_ADAPTERS: Record<string, PublisherAdapter> = {
  instagram: realAdapter("META_APP_ID"),
  facebook: realAdapter("META_APP_ID"),
  tiktok: realAdapter("TIKTOK_CLIENT_KEY"),
  linkedin: realAdapter("LINKEDIN_CLIENT_ID"),
  youtube: realAdapter("GOOGLE_CLIENT_ID"),
  x: realAdapter("X_API_KEY"),
  pinterest: realAdapter("PINTEREST_APP_ID"),
  wordpress: wordpressAdapter,
};

export function getAdapter(platform: string): PublisherAdapter {
  // PUBLISH_MODE=live schaltet auf die echten Adapter um (Phase 2b)
  if (process.env.PUBLISH_MODE === "live") {
    return REAL_ADAPTERS[platform] ?? simulatedAdapter;
  }
  return simulatedAdapter;
}
