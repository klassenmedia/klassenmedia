import { describe, expect, it } from "vitest";
import { FORMATS, isExternalLink, mediaBackground, PLATFORMS } from "@/lib/types";

describe("isExternalLink", () => {
  it("recognizes http(s) URLs", () => {
    expect(isExternalLink("https://dropbox.com/s/abc")).toBe(true);
    expect(isExternalLink("http://drive.google.com/x")).toBe(true);
  });

  it("rejects local upload paths and placeholders", () => {
    expect(isExternalLink("/uploads/abc.jpg")).toBe(false);
    expect(isExternalLink("placeholder:210")).toBe(false);
  });
});

describe("mediaBackground", () => {
  it("renders a gradient for a placeholder", () => {
    expect(mediaBackground("placeholder:210")).toContain("linear-gradient");
  });

  it("renders a neutral tile for an external link (no image preview)", () => {
    const bg = mediaBackground("https://dropbox.com/s/big-video.mp4");
    expect(bg).toBe("linear-gradient(135deg, #334155, #1e293b)");
  });

  it("renders a real image URL as a background image", () => {
    expect(mediaBackground("/uploads/foo.jpg")).toBe('url("/uploads/foo.jpg") center/cover');
  });
});

describe("FORMATS", () => {
  it("carousel allows up to 20 slides", () => {
    expect(FORMATS.carousel.maxMedia).toBe(20);
  });

  it("text posts carry no media", () => {
    expect(FORMATS.text.maxMedia).toBe(0);
  });
});

describe("PLATFORMS", () => {
  it("has an entry for every supported platform", () => {
    for (const key of ["instagram", "facebook", "tiktok", "linkedin", "youtube", "x", "pinterest"]) {
      expect(PLATFORMS).toHaveProperty(key);
    }
  });
});
