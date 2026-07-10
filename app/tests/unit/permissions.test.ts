import { describe, expect, it } from "vitest";
import { ASSIGNABLE_ROLES, can, ROLE_RANK, type Capability, type Role } from "@/lib/permissions";

const ROLES: Role[] = ["owner", "admin", "editor", "viewer"];
const CAPS: Capability[] = ["content", "approve", "accounts", "ai_settings", "billing", "team"];

describe("can()", () => {
  it("owner may everything", () => {
    for (const cap of CAPS) expect(can("owner", cap)).toBe(true);
  });

  it("viewer may nothing", () => {
    for (const cap of CAPS) expect(can("viewer", cap)).toBe(false);
  });

  it("only owner may billing", () => {
    for (const role of ROLES) {
      expect(can(role, "billing")).toBe(role === "owner");
    }
  });

  it("editor may create content but not approve it", () => {
    expect(can("editor", "content")).toBe(true);
    expect(can("editor", "approve")).toBe(false);
  });

  it("admin may approve, manage accounts/ai/team, but not billing", () => {
    expect(can("admin", "approve")).toBe(true);
    expect(can("admin", "accounts")).toBe(true);
    expect(can("admin", "ai_settings")).toBe(true);
    expect(can("admin", "team")).toBe(true);
    expect(can("admin", "billing")).toBe(false);
  });
});

describe("ROLE_RANK", () => {
  it("orders roles strictly from viewer (lowest) to owner (highest)", () => {
    expect(ROLE_RANK.viewer).toBeLessThan(ROLE_RANK.editor);
    expect(ROLE_RANK.editor).toBeLessThan(ROLE_RANK.admin);
    expect(ROLE_RANK.admin).toBeLessThan(ROLE_RANK.owner);
  });
});

describe("ASSIGNABLE_ROLES", () => {
  it("never includes owner — ownership can't be assigned away", () => {
    expect(ASSIGNABLE_ROLES).not.toContain("owner");
  });
});
