import { describe, expect, it } from "vitest";
import { validateForPlatform } from "@/lib/publishing/rules";

const post = (over: Partial<{ body: string; format: string; mediaCount: number }> = {}) => ({
  body: "Hallo Welt",
  format: "image",
  mediaCount: 1,
  ...over,
});

describe("validateForPlatform", () => {
  it("accepts a valid image post on instagram", () => {
    expect(validateForPlatform(post(), "instagram")).toBeNull();
  });

  it("rejects text over the platform's character limit", () => {
    const long = "x".repeat(281);
    expect(validateForPlatform(post({ body: long, format: "text" }), "x")).toMatch(/zu lang/);
  });

  it("allows exactly the character limit", () => {
    const exact = "x".repeat(280);
    expect(validateForPlatform(post({ body: exact, format: "text" }), "x")).toBeNull();
  });

  it("rejects text-only posts on image-first platforms", () => {
    for (const platform of ["instagram", "tiktok", "youtube", "pinterest"]) {
      expect(validateForPlatform(post({ format: "text", mediaCount: 0 }), platform)).toMatch(
        /nicht möglich/
      );
    }
  });

  it("allows text-only posts on x and linkedin", () => {
    expect(validateForPlatform(post({ format: "text", mediaCount: 0 }), "x")).toBeNull();
    expect(validateForPlatform(post({ format: "text", mediaCount: 0 }), "linkedin")).toBeNull();
  });

  it("restricts stories to instagram and facebook", () => {
    expect(validateForPlatform(post({ format: "story" }), "linkedin")).toMatch(/nur auf/);
    expect(validateForPlatform(post({ format: "story" }), "instagram")).toBeNull();
  });

  it("rejects carousels on x, youtube, tiktok", () => {
    for (const platform of ["x", "youtube", "tiktok"]) {
      expect(
        validateForPlatform(post({ format: "carousel", mediaCount: 3 }), platform)
      ).toMatch(/nicht unterstützt/);
    }
  });

  it("requires at least 2 media items for a carousel", () => {
    expect(
      validateForPlatform(post({ format: "carousel", mediaCount: 1 }), "instagram")
    ).toMatch(/mindestens 2/);
    expect(
      validateForPlatform(post({ format: "carousel", mediaCount: 2 }), "instagram")
    ).toBeNull();
  });

  it("rejects a video post with no media", () => {
    expect(validateForPlatform(post({ format: "video", mediaCount: 0 }), "youtube")).toMatch(
      /ohne Video/
    );
  });

  it("only allows video posts on youtube and tiktok", () => {
    expect(validateForPlatform(post({ format: "image", mediaCount: 1 }), "youtube")).toMatch(
      /nur Videos/
    );
    expect(validateForPlatform(post({ format: "video", mediaCount: 1 }), "youtube")).toBeNull();
  });

  it("rejects image posts with no image on instagram/pinterest", () => {
    expect(
      validateForPlatform(post({ format: "image", mediaCount: 0 }), "pinterest")
    ).toMatch(/nicht möglich/);
  });
});
