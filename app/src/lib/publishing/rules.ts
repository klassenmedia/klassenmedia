// Plattformregeln: Was darf wohin? Wird vor jedem Publishing-Versuch geprüft
// und liefert deutsche Fehlermeldungen für die UI.

interface PostShape {
  body: string;
  format: string; // text | image | video | carousel | story | article
  mediaCount: number;
  title?: string | null;
}

const CHAR_LIMITS: Record<string, number> = {
  x: 280,
  instagram: 2200,
  facebook: 5000,
  tiktok: 2200,
  linkedin: 3000,
  youtube: 5000,
  pinterest: 800,
  // wordpress bewusst ohne Limit — Blogartikel dürfen lang sein
};

/** null = ok, sonst Fehlermeldung */
export function validateForPlatform(post: PostShape, platform: string): string | null {
  const limit = CHAR_LIMITS[platform];
  if (limit && post.body.length > limit) {
    return `Text zu lang für ${platform} (${post.body.length}/${limit} Zeichen)`;
  }

  switch (post.format) {
    case "text":
      if (["instagram", "tiktok", "youtube", "pinterest"].includes(platform)) {
        return `Reine Text-Posts sind auf ${platform} nicht möglich — Bild oder Video anhängen`;
      }
      break;
    case "story":
      if (!["instagram", "facebook"].includes(platform)) {
        return `Stories gibt es nur auf Instagram und Facebook`;
      }
      break;
    case "carousel":
      if (["x", "youtube", "tiktok"].includes(platform)) {
        return `Karussells werden auf ${platform} nicht unterstützt`;
      }
      if (post.mediaCount < 2) return "Karussell braucht mindestens 2 Medien";
      break;
    case "video":
      if (post.mediaCount < 1) return "Video-Post ohne Video — bitte Medium anhängen";
      break;
    case "image":
      if (post.mediaCount < 1 && ["instagram", "pinterest"].includes(platform)) {
        return `Bild-Post ohne Bild ist auf ${platform} nicht möglich`;
      }
      break;
    case "article":
      if (platform !== "wordpress") {
        return `Blogartikel können nur auf der Website (WordPress) veröffentlicht werden`;
      }
      if (!post.title || !post.title.trim()) return "Blogartikel braucht einen Titel";
      break;
  }

  if (["youtube", "tiktok"].includes(platform) && post.format !== "video") {
    return `Auf ${platform} können nur Videos veröffentlicht werden`;
  }
  if (platform === "wordpress" && post.format !== "article") {
    return `Auf der Website können nur Blogartikel veröffentlicht werden`;
  }

  return null;
}
