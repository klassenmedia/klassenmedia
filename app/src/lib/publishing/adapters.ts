// Adapter-Pattern fürs Publishing: pro Plattform ein Adapter mit einheitlichem
// Interface. Solange keine Plattform-App-Credentials vorliegen (Meta App
// Review etc.), läuft alles über den Simulations-Adapter — derselbe Codepfad,
// nur ohne echten API-Call. Die echten Adapter docken hier an.

import { validateForPlatform } from "./rules";
import { toPublicUrl } from "./public-url";
import { decrypt } from "../crypto";

export interface PublishTarget {
  platform: string;
  handle: string;
  accessTokenEnc: string | null;
  /** ID beim Provider (IG-Business-Account, FB-Page, …) — aus dem OAuth-Callback */
  externalId?: string | null;
}

export interface PublishPost {
  body: string;
  format: string;
  mediaCount: number;
  title?: string | null;
  /** Medien-URLs in Sortierreihenfolge (lokale /uploads/-Pfade oder absolute URLs) */
  mediaUrls?: string[];
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

// ── Meta (Instagram + Facebook) — echte Graph-API-Adapter ────────────
// Aktiv mit PUBLISH_MODE=live + verbundenem Account aus dem OAuth-Flow.
// Docs: https://developers.facebook.com/docs/instagram-platform/content-publishing

const GRAPH = "https://graph.facebook.com/v23.0";

async function graphCall(
  path: string,
  token: string,
  params: Record<string, string> = {},
  method: "GET" | "POST" = "POST"
): Promise<Record<string, unknown>> {
  const url = new URL(`${GRAPH}${path}`);
  let body: URLSearchParams | undefined;
  if (method === "GET") {
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
    url.searchParams.set("access_token", token);
  } else {
    body = new URLSearchParams(params);
    body.set("access_token", token);
  }
  let res: Response;
  try {
    res = await fetch(url, { method, body, signal: AbortSignal.timeout(60_000) });
  } catch {
    throw new Error("Meta-API nicht erreichbar — später erneut versuchen");
  }
  const json = (await res.json().catch(() => null)) as Record<string, unknown> | null;
  if (!res.ok || !json) {
    const detail = (json?.error as { message?: string } | undefined)?.message ?? `Status ${res.status}`;
    throw new Error(`Meta hat abgelehnt: ${detail}`);
  }
  return json;
}

function requireMetaTarget(target: PublishTarget): { igOrPageId: string; token: string } {
  if (!target.externalId || !target.accessTokenEnc) {
    throw new Error(
      "Account nicht über den echten Login verbunden — unter Accounts neu verbinden."
    );
  }
  return { igOrPageId: target.externalId, token: decrypt(target.accessTokenEnc) };
}

function publicMediaUrls(post: PublishPost): string[] {
  const urls = (post.mediaUrls ?? [])
    .map((u) => toPublicUrl(u))
    .filter((u): u is string => Boolean(u));
  if (urls.length === 0) {
    throw new Error("Keine veröffentlichbaren Medien — Demo-Platzhalter können nicht live gepostet werden.");
  }
  return urls;
}

/** IG-Container brauchen je nach Medium Verarbeitungszeit — begrenzt pollen. */
async function waitForContainer(containerId: string, token: string): Promise<void> {
  for (let i = 0; i < 10; i++) {
    const status = await graphCall(`/${containerId}`, token, { fields: "status_code" }, "GET");
    if (status.status_code === "FINISHED") return;
    if (status.status_code === "ERROR") {
      throw new Error("Meta konnte das Medium nicht verarbeiten (Format/Codec prüfen)");
    }
    await new Promise((r) => setTimeout(r, 3_000));
  }
  throw new Error("Meta-Medienverarbeitung dauert zu lange — wird beim nächsten Lauf erneut versucht");
}

const instagramAdapter: PublisherAdapter = {
  async publish(post, target) {
    const error = validateForPlatform(post, target.platform);
    if (error) throw new Error(error);
    const { igOrPageId: igId, token } = requireMetaTarget(target);
    const media = publicMediaUrls(post);

    let containerId: string;
    if (post.format === "carousel") {
      const children: string[] = [];
      for (const url of media.slice(0, 10)) {
        const child = await graphCall(`/${igId}/media`, token, {
          image_url: url,
          is_carousel_item: "true",
        });
        children.push(child.id as string);
      }
      const parent = await graphCall(`/${igId}/media`, token, {
        media_type: "CAROUSEL",
        children: children.join(","),
        caption: post.body,
      });
      containerId = parent.id as string;
    } else if (post.format === "video") {
      const container = await graphCall(`/${igId}/media`, token, {
        media_type: "REELS",
        video_url: media[0],
        caption: post.body,
      });
      containerId = container.id as string;
      await waitForContainer(containerId, token);
    } else if (post.format === "story") {
      const container = await graphCall(`/${igId}/media`, token, {
        media_type: "STORIES",
        image_url: media[0],
      });
      containerId = container.id as string;
    } else {
      const container = await graphCall(`/${igId}/media`, token, {
        image_url: media[0],
        caption: post.body,
      });
      containerId = container.id as string;
    }

    const published = await graphCall(`/${igId}/media_publish`, token, {
      creation_id: containerId,
    });
    return { externalId: published.id as string };
  },
};

const facebookAdapter: PublisherAdapter = {
  async publish(post, target) {
    const error = validateForPlatform(post, target.platform);
    if (error) throw new Error(error);
    const { igOrPageId: pageId, token } = requireMetaTarget(target);

    if (post.format === "story") {
      throw new Error("Facebook-Stories sind über die API nicht möglich — nur Instagram-Stories");
    }
    if (post.format === "text") {
      const res = await graphCall(`/${pageId}/feed`, token, { message: post.body });
      return { externalId: res.id as string };
    }

    const media = publicMediaUrls(post);
    if (post.format === "video") {
      const res = await graphCall(`/${pageId}/videos`, token, {
        file_url: media[0],
        description: post.body,
      });
      return { externalId: res.id as string };
    }
    if (post.format === "carousel") {
      // Fotos erst unveröffentlicht hochladen, dann als ein Beitrag anhängen
      const ids: string[] = [];
      for (const url of media.slice(0, 10)) {
        const photo = await graphCall(`/${pageId}/photos`, token, {
          url,
          published: "false",
        });
        ids.push(photo.id as string);
      }
      const params: Record<string, string> = { message: post.body };
      ids.forEach((id, i) => {
        params[`attached_media[${i}]`] = JSON.stringify({ media_fbid: id });
      });
      const res = await graphCall(`/${pageId}/feed`, token, params);
      return { externalId: res.id as string };
    }
    // Einzelbild
    const res = await graphCall(`/${pageId}/photos`, token, {
      url: media[0],
      message: post.body,
    });
    return { externalId: res.id as string };
  },
};

const REAL_ADAPTERS: Record<string, PublisherAdapter> = {
  instagram: instagramAdapter,
  facebook: facebookAdapter,
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
