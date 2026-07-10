import { describe, expect, it } from "vitest";
import {
  accountSchema,
  adCampaignSchema,
  apiTokenNameSchema,
  canAfford,
  captionSchema,
  changeRoleSchema,
  clientSchema,
  CREDIT_PACKAGES,
  followUpSchema,
  FORMAT_MAX_MEDIA,
  imageSchema,
  interactionSchema,
  inviteMemberSchema,
  inviteSchema,
  keysSchema,
  mcpCreatePostSchema,
  postSchema,
  USAGE_COSTS,
  wordpressAccountSchema,
} from "@/lib/schemas";

describe("postSchema", () => {
  const valid = {
    body: "Neuer Beitrag",
    date: "2026-07-10",
    time: "09:30",
    accountIds: ["acc_1"],
    status: "draft",
    format: "text",
    media: [],
  };

  it("accepts a valid draft post", () => {
    expect(postSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects an empty body", () => {
    const result = postSchema.safeParse({ ...valid, body: "  " });
    expect(result.success).toBe(false);
  });

  it("rejects a malformed date", () => {
    expect(postSchema.safeParse({ ...valid, date: "10.07.2026" }).success).toBe(false);
  });

  it("rejects a malformed time", () => {
    expect(postSchema.safeParse({ ...valid, time: "9:30" }).success).toBe(false);
  });

  it("requires at least one account", () => {
    expect(postSchema.safeParse({ ...valid, accountIds: [] }).success).toBe(false);
  });

  it("rejects an unknown status or format", () => {
    expect(postSchema.safeParse({ ...valid, status: "archived" }).success).toBe(false);
    expect(postSchema.safeParse({ ...valid, format: "podcast" }).success).toBe(false);
  });

  it("requires a title when format is article", () => {
    expect(postSchema.safeParse({ ...valid, format: "article" }).success).toBe(false);
    expect(
      postSchema.safeParse({ ...valid, format: "article", title: "  " }).success
    ).toBe(false);
    expect(
      postSchema.safeParse({ ...valid, format: "article", title: "Ein Titel" }).success
    ).toBe(true);
  });

  it("does not require a title for non-article formats", () => {
    expect(postSchema.safeParse({ ...valid, format: "text", title: null }).success).toBe(true);
  });

  it("accepts an optional reminderMode flag", () => {
    expect(postSchema.safeParse({ ...valid, format: "video", reminderMode: true }).success).toBe(
      true
    );
    expect(postSchema.safeParse(valid).success).toBe(true); // reminderMode omitted is fine
  });

  it("caps media at 20 items", () => {
    const media = Array.from({ length: 21 }, (_, i) => ({ id: null, url: `https://x.test/${i}` }));
    expect(postSchema.safeParse({ ...valid, media }).success).toBe(false);
    expect(postSchema.safeParse({ ...valid, media: media.slice(0, 20) }).success).toBe(true);
  });
});

describe("clientSchema", () => {
  it("accepts a name without a color", () => {
    expect(clientSchema.safeParse({ name: "Bäckerei Berger" }).success).toBe(true);
  });

  it("rejects an invalid hex color", () => {
    expect(clientSchema.safeParse({ name: "X", color: "blue" }).success).toBe(false);
    expect(clientSchema.safeParse({ name: "X", color: "#zzzzzz" }).success).toBe(false);
  });

  it("accepts a valid hex color", () => {
    expect(clientSchema.safeParse({ name: "X", color: "#2563eb" }).success).toBe(true);
  });

  it("rejects an empty name", () => {
    expect(clientSchema.safeParse({ name: "" }).success).toBe(false);
  });
});

describe("accountSchema / inviteSchema", () => {
  it("rejects an unknown platform", () => {
    expect(
      accountSchema.safeParse({ platform: "myspace", displayName: "A", handle: "@a" }).success
    ).toBe(false);
  });

  it("accepts a known platform", () => {
    expect(
      accountSchema.safeParse({ platform: "instagram", displayName: "A", handle: "@a" }).success
    ).toBe(true);
  });

  it("requires a non-empty client name for invites", () => {
    expect(inviteSchema.safeParse({ platform: "instagram", clientName: "" }).success).toBe(false);
    expect(
      inviteSchema.safeParse({ platform: "instagram", clientName: "Frauke" }).success
    ).toBe(true);
  });
});

describe("wordpressAccountSchema", () => {
  const valid = {
    displayName: "Blog Bäckerei Berger",
    siteUrl: "https://baeckerei-berger.de",
    username: "redaktion",
    appPassword: "xxxx xxxx xxxx xxxx xxxx xxxx",
  };

  it("accepts valid connection data", () => {
    expect(wordpressAccountSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects a non-URL site address", () => {
    expect(wordpressAccountSchema.safeParse({ ...valid, siteUrl: "baeckerei-berger" }).success).toBe(
      false
    );
  });

  it("rejects missing username or app password", () => {
    expect(wordpressAccountSchema.safeParse({ ...valid, username: "" }).success).toBe(false);
    expect(wordpressAccountSchema.safeParse({ ...valid, appPassword: "" }).success).toBe(false);
  });
});

describe("adCampaignSchema", () => {
  const valid = {
    postId: "post_1",
    accountId: "acc_1",
    objective: "reach",
    budgetTotal: 50,
    startDate: "2026-08-01",
    endDate: "2026-08-08",
  };

  it("accepts a valid campaign", () => {
    expect(adCampaignSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects an end date before the start date", () => {
    expect(
      adCampaignSchema.safeParse({ ...valid, startDate: "2026-08-10", endDate: "2026-08-01" }).success
    ).toBe(false);
  });

  it("rejects a budget below the minimum", () => {
    expect(adCampaignSchema.safeParse({ ...valid, budgetTotal: 1 }).success).toBe(false);
  });

  it("rejects an unknown objective", () => {
    expect(adCampaignSchema.safeParse({ ...valid, objective: "sales" }).success).toBe(false);
  });
});

describe("interactionSchema / followUpSchema", () => {
  it("accepts a call entry with optional date", () => {
    expect(
      interactionSchema.safeParse({ kind: "call", text: "Kurz telefoniert", happenedAt: "2026-07-10" })
        .success
    ).toBe(true);
    expect(interactionSchema.safeParse({ kind: "note", text: "Nur Notiz" }).success).toBe(true);
  });

  it("rejects unknown kinds and empty text", () => {
    expect(interactionSchema.safeParse({ kind: "fax", text: "x" }).success).toBe(false);
    expect(interactionSchema.safeParse({ kind: "call", text: "  " }).success).toBe(false);
  });

  it("follow-up accepts a date with note and null to clear", () => {
    expect(followUpSchema.safeParse({ date: "2026-08-01", note: "Nachfassen" }).success).toBe(true);
    expect(followUpSchema.safeParse({ date: null }).success).toBe(true);
    expect(followUpSchema.safeParse({ date: "01.08.2026" }).success).toBe(false);
  });
});

describe("apiTokenNameSchema", () => {
  it("accepts a normal name", () => {
    expect(apiTokenNameSchema.safeParse("Claude Desktop").success).toBe(true);
  });

  it("rejects an empty name", () => {
    expect(apiTokenNameSchema.safeParse("  ").success).toBe(false);
  });
});

describe("mcpCreatePostSchema", () => {
  const valid = {
    body: "Beitrag über MCP angelegt",
    date: "2026-08-01",
    time: "10:00",
    accountIds: ["acc_1"],
    format: "text",
    status: "draft",
  };

  it("accepts a valid draft/scheduled post", () => {
    expect(mcpCreatePostSchema.safeParse(valid).success).toBe(true);
    expect(mcpCreatePostSchema.safeParse({ ...valid, status: "scheduled" }).success).toBe(true);
  });

  it("rejects a review status (not offered over MCP)", () => {
    expect(mcpCreatePostSchema.safeParse({ ...valid, status: "review" }).success).toBe(false);
  });

  it("requires a title for article format, like the composer schema", () => {
    expect(mcpCreatePostSchema.safeParse({ ...valid, format: "article" }).success).toBe(false);
    expect(
      mcpCreatePostSchema.safeParse({ ...valid, format: "article", title: "Titel" }).success
    ).toBe(true);
  });

  it("requires at least one account", () => {
    expect(mcpCreatePostSchema.safeParse({ ...valid, accountIds: [] }).success).toBe(false);
  });
});

describe("keysSchema", () => {
  it("accepts an empty object (both keys optional)", () => {
    expect(keysSchema.safeParse({}).success).toBe(true);
  });

  it("rejects an oversized key", () => {
    expect(keysSchema.safeParse({ anthropicKey: "x".repeat(301) }).success).toBe(false);
  });
});

describe("inviteMemberSchema / changeRoleSchema", () => {
  it("rejects an invalid email", () => {
    expect(inviteMemberSchema.safeParse({ email: "not-an-email", role: "editor" }).success).toBe(
      false
    );
  });

  it("lower-cases the email", () => {
    const parsed = inviteMemberSchema.safeParse({ email: "Andreas@Klassenmedia.de", role: "editor" });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.email).toBe("andreas@klassenmedia.de");
  });

  it("rejects assigning the owner role", () => {
    expect(inviteMemberSchema.safeParse({ email: "a@b.de", role: "owner" }).success).toBe(false);
    expect(changeRoleSchema.safeParse({ memberId: "m1", role: "owner" }).success).toBe(false);
  });

  it("accepts admin/editor/viewer", () => {
    for (const role of ["admin", "editor", "viewer"]) {
      expect(changeRoleSchema.safeParse({ memberId: "m1", role }).success).toBe(true);
    }
  });
});

describe("captionSchema / imageSchema", () => {
  it("rejects an empty topic/prompt", () => {
    expect(captionSchema.safeParse({ topic: "" }).success).toBe(false);
    expect(imageSchema.safeParse("").success).toBe(false);
  });

  it("accepts a topic without a platform", () => {
    expect(captionSchema.safeParse({ topic: "Sommer-Angebot" }).success).toBe(true);
  });
});

describe("credit & format price tables", () => {
  it("matches the documented usage costs", () => {
    expect(USAGE_COSTS).toEqual({ caption: 1, image: 6, learnings: 2 });
  });

  it("carousel allows up to 20 media, single-media formats allow 1", () => {
    expect(FORMAT_MAX_MEDIA.carousel).toBe(20);
    expect(FORMAT_MAX_MEDIA.image).toBe(1);
    expect(FORMAT_MAX_MEDIA.text).toBe(0);
  });

  it("credit packages scale credits with price", () => {
    expect(CREDIT_PACKAGES.S.credits).toBeLessThan(CREDIT_PACKAGES.M.credits);
    expect(CREDIT_PACKAGES.M.credits).toBeLessThan(CREDIT_PACKAGES.L.credits);
  });
});

describe("canAfford", () => {
  it("is true when balance covers cost, false otherwise", () => {
    expect(canAfford(10, 6)).toBe(true);
    expect(canAfford(6, 6)).toBe(true);
    expect(canAfford(5, 6)).toBe(false);
    expect(canAfford(0, 1)).toBe(false);
  });
});
