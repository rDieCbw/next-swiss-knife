import { listAudit } from "@swiss/data-mongo";
import { guard } from "@/server/guard";

export async function GET(request: Request) {
  const access = await guard(request, "audit");
  if (!access.ok) {
    return Response.json(access, { status: access.status });
  }
  return Response.json(await listAudit(access.organizationId));
}
