import type { AccessRole } from "./schemas";

export type AccessRoute = "public" | "tenant" | "audit";

export type AccessInput = {
  sessionOrganizationId: string | null;
  headerTenantId: string | null;
  role: AccessRole | null;
  department: string | null;
  route: AccessRoute;
};

export type AccessDecision =
  | { ok: true }
  | { ok: false; status: 400 | 401 | 403; reason: string };

export function authorize(input: AccessInput): AccessDecision {
  if (input.route === "public") {
    return { ok: true };
  }

  if (!input.sessionOrganizationId) {
    return { ok: false, status: 401, reason: "missing-session" };
  }

  if (!input.headerTenantId) {
    return { ok: false, status: 400, reason: "missing-tenant" };
  }

  if (input.headerTenantId !== input.sessionOrganizationId) {
    return { ok: false, status: 403, reason: "tenant-mismatch" };
  }

  if (input.route === "audit") {
    const allowed =
      input.role === "owner" ||
      input.role === "admin" ||
      input.department === "finance";
    if (!allowed) {
      return { ok: false, status: 403, reason: "audit-forbidden" };
    }
  }

  return { ok: true };
}
