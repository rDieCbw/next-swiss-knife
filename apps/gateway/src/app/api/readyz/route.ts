import { readyResponse } from "@swiss/observability";
import { getRedis } from "@swiss/cache-redis";
import { getDb } from "@swiss/data-mongo";

export function GET() {
  return readyResponse("gateway", {
    mongo: async () => {
      await (await getDb()).command({ ping: 1 });
    },
    redis: async () => {
      await (await getRedis()).ping();
    },
  });
}
