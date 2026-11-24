import { describe, expect, it } from "vitest";
import { authorize } from "./authorize";

const member = {
  sessionOrganizationId: "org-1",
  headerTenantId: "org-1",
  role: "member" as const,
  department: "ops",
  route: "tenant" as const,
};

describe("authorize", () => {
  it("allows a public route without a session", () => {
    expect(authorize({ ...member, route: "public", sessionOrganizationId: null, headerTenantId: null })).toEqual({
      ok: true,
    });
  });

  it("rejects a tenant route when the session has no organization", () => {
    const decision = authorize({ ...member, sessionOrganizationId: null });
    expect(decision.ok).toBe(false);
    if (!decision.ok) expect(decision.status).toBe(401);
  });

  it("rejects a tenant route when x-tenant-id is missing", () => {
    const decision = authorize({ ...member, headerTenantId: null });
    expect(decision.ok).toBe(false);
    if (!decision.ok) expect(decision.status).toBe(400);
  });

  it("rejects a header that does not match the session claim", () => {
    const decision = authorize({ ...member, headerTenantId: "org-2" });
    expect(decision).toEqual({ ok: false, status: 403, reason: "tenant-mismatch" });
  });

  it("allows audit reads for finance members", () => {
    expect(authorize({ ...member, route: "audit", department: "finance" })).toEqual({ ok: true });
  });

  it("allows audit reads for owners", () => {
    expect(authorize({ ...member, route: "audit", role: "owner" })).toEqual({ ok: true });
  });

  it("rejects audit reads for a member outside finance", () => {
    const decision = authorize({ ...member, route: "audit" });
    expect(decision.ok).toBe(false);
    if (!decision.ok) expect(decision.status).toBe(403);
  });
});
