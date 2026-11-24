import { cartLineSchema } from "@swiss/contracts";
import { publishEvent } from "@swiss/cache-redis";
import { listOrders, listProducts, saveOrder } from "@swiss/data-mongo";
import { contextFromHeaders, createLogger, recordHttp, runWithContext } from "@swiss/observability";
import { guard } from "@/server/guard";

const logger = createLogger("gateway");

export async function GET(request: Request) {
  const started = Date.now();
  const access = await guard(request, "tenant");
  if (!access.ok) {
    recordHttp("/api/orders", "GET", access.status, Date.now() - started);
    return Response.json(access, { status: access.status });
  }
  const orders = await listOrders(access.organizationId);
  recordHttp("/api/orders", "GET", 200, Date.now() - started);
  return Response.json(orders);
}

export async function POST(request: Request) {
  const started = Date.now();
  const access = await guard(request, "tenant");
  if (!access.ok) {
    recordHttp("/api/orders", "POST", access.status, Date.now() - started);
    return Response.json(access, { status: access.status });
  }
  return runWithContext(
    { ...contextFromHeaders(request.headers), tenantId: access.organizationId, userId: access.userId },
    async () => {
      const body = cartLineSchema.array().parse((await request.json()).lines);
      const order = await saveOrder(access.organizationId, body, await listProducts());
      await publishEvent("stream:orders", "order.placed", order);
      logger.info({ orderId: order.id }, "order placed");
      recordHttp("/api/orders", "POST", 201, Date.now() - started);
      return Response.json(order, { status: 201 });
    },
  );
}
