import { authorize, type AccessRoute } from "@swiss/contracts";
import { fetchSession } from "@swiss/auth-client/session";
import { getMemberAttribute, getMembership } from "@swiss/data-mongo";

export async function guard(request: Request, route: Exclude<AccessRoute, "public">) {
  const cookie = request.headers.get("cookie") ?? "";
  const session = await fetchSession(cookie);
  const organizationId = session?.session.activeOrganizationId ?? null;
  const userId = session?.user.id ?? null;
  const membership = organizationId && userId ? await getMembership(organizationId, userId) : null;
  const attribute = organizationId && userId ? await getMemberAttribute(organizationId, userId) : null;
  const role = membership?.role === "owner" || membership?.role === "admin" || membership?.role === "member" ? membership.role : null;
  const decision = authorize({
    sessionOrganizationId: organizationId,
    headerTenantId: request.headers.get("x-tenant-id"),
    role,
    department: attribute?.department ?? null,
    route,
  });
  if (!decision.ok) {
    return decision;
  }
  return { ok: true as const, organizationId: organizationId!, userId: userId! };
}
