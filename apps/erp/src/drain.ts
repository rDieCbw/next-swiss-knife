import { acknowledge, ensureGroup, readGroup } from "@swiss/cache-redis";
import { saveAudit } from "@swiss/data-mongo";
import { createLogger, runWithContext } from "@swiss/observability";

const logger = createLogger("erp");

export function contextForEvent(event: { requestId?: string; traceId?: string; tenantId?: string; payload: string }) {
  const payload = JSON.parse(event.payload) as { organizationId?: string };
  return {
    requestId: event.requestId,
    traceId: event.traceId,
    tenantId: event.tenantId || payload.organizationId,
  };
}

export async function drainOrders() {
  await ensureGroup("stream:orders", "erp");
  const events = await readGroup("stream:orders", "erp", "erp-web");
  for (const event of events) {
    const payload = JSON.parse(event.payload) as { id: string; organizationId: string };
    const context = contextForEvent(event);
    runWithContext(context, () => {
      logger.info({ action: event.type, subjectId: payload.id }, "stream event consumed");
    });
    await saveAudit({ organizationId: payload.organizationId, action: event.type, subjectId: payload.id });
    await acknowledge("stream:orders", "erp", event.id);
  }
  return events.length;
}
