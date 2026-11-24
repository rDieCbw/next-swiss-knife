import { cookies } from "next/headers";
import { fetchSession } from "@swiss/auth-client/session";
import { listAudit, listOrders } from "@swiss/contracts/api";
import { drainOrders } from "@/drain";
import { OfflineQueue } from "./queue";

export const dynamic = "force-dynamic";

export default async function ErpHome() {
  const cookie = (await cookies()).toString();
  const session = await fetchSession(cookie);
  const tenantId = session?.session.activeOrganizationId ?? "";
  let drained = 0;
  let orders: Awaited<ReturnType<typeof listOrders>> = [];
  let audit: Awaited<ReturnType<typeof listAudit>> = [];
  let auditError = "";
  if (tenantId) {
    try { drained = await drainOrders(); } catch { drained = 0; }
    try { orders = await listOrders(tenantId, cookie); } catch { orders = []; }
    try { audit = await listAudit(tenantId, cookie); } catch (error) { auditError = error instanceof Error ? error.message : "audit-unavailable"; }
  }
  return (
    <>
      <h1>ERP</h1>
      <p>Tenant {tenantId || "sem sessão"}</p>
      <p>Eventos drenados: {drained}</p>
      <ul>{orders.map((order) => <li key={order.id}>{order.id} · {order.totalCents}</li>)}</ul>
      <h2>Auditoria</h2>
      <p role="status">{auditError}</p>
      <ul>{audit.map((entry) => <li key={entry.id}>{entry.action}</li>)}</ul>
      <OfflineQueue tenantId={tenantId} />
    </>
  );
}
