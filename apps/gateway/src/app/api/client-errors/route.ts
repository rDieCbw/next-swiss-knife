import { allowRequest } from "@swiss/cache-redis";
import { createLogger } from "@swiss/observability";

const logger = createLogger("gateway");

export async function POST(request: Request) {
  const limit = await allowRequest("client-errors", 30, 1, 1000).catch(() => ({ allowed: true, remaining: 0 }));
  if (!limit.allowed) {
    return Response.json({ reason: "rate-limited" }, { status: 429 });
  }
  const report = (await request.json()) as Record<string, unknown>;
  logger.info({ report }, "client error");
  return Response.json({ status: "ok" });
}
