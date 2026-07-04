// Adapter-Pattern fürs Publishing: pro Plattform ein Adapter mit einheitlichem
// Interface. Solange keine Plattform-App-Credentials vorliegen (Meta App
// Review etc.), läuft alles über den Simulations-Adapter — derselbe Codepfad,
// nur ohne echten API-Call. Die echten Adapter docken hier an.

import { validateForPlatform } from "./rules";

export interface PublishTarget {
  platform: string;
  handle: string;
  accessTokenEnc: string | null;
}

export interface PublishPost {
  body: string;
  format: string;
  mediaCount: number;
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

const REAL_ADAPTERS: Record<string, PublisherAdapter> = {
  instagram: realAdapter("META_APP_ID"),
  facebook: realAdapter("META_APP_ID"),
  tiktok: realAdapter("TIKTOK_CLIENT_KEY"),
  linkedin: realAdapter("LINKEDIN_CLIENT_ID"),
  youtube: realAdapter("GOOGLE_CLIENT_ID"),
  x: realAdapter("X_API_KEY"),
  pinterest: realAdapter("PINTEREST_APP_ID"),
};

export function getAdapter(platform: string): PublisherAdapter {
  // PUBLISH_MODE=live schaltet auf die echten Adapter um (Phase 2b)
  if (process.env.PUBLISH_MODE === "live") {
    return REAL_ADAPTERS[platform] ?? simulatedAdapter;
  }
  return simulatedAdapter;
}
