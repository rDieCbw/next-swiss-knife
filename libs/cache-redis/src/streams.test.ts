import { RedisMemoryServer } from "redis-memory-server";
import { spawnSync } from "node:child_process";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { closeRedis } from "./client";
import { allowRequest } from "./rate-limit";
import { acknowledge, ensureGroup, publishEvent, readGroup } from "./streams";

const systemRedis = spawnSync("redis-server", ["--version"], { encoding: "utf8" }).status === 0;
const redisUrl = process.env.REDIS_URL;
const canRun = Boolean(redisUrl || systemRedis);

describe.skipIf(!canRun)("redis", () => {
  let server: RedisMemoryServer | undefined;

  beforeAll(async () => {
    if (!process.env.REDIS_URL && systemRedis) {
      server = new RedisMemoryServer({ binary: { systemBinary: "redis-server" } });
      const host = await server.getHost();
      process.env.REDIS_URL = `redis://${host}:${await server.getPort()}`;
    }
  }, 30_000);

  afterAll(async () => {
    await closeRedis();
    await server?.stop();
  });

  it("publishes an order event and acknowledges it in the erp group", async () => {
    const stream = `stream:orders:${Date.now()}`;
    await ensureGroup(stream, "erp");
    await publishEvent(stream, "order.placed", { id: "order-1" });
    const events = await readGroup(stream, "erp", "erp-1");
    expect(events).toHaveLength(1);
    expect(events[0]?.type).toBe("order.placed");
    await acknowledge(stream, "erp", events[0]!.id);
    expect(await readGroup(stream, "erp", "erp-1")).toHaveLength(0);
  });

  it("denies requests after the token bucket is empty", async () => {
    const key = `burst-${Date.now()}`;
    expect((await allowRequest(key, 1, 1, 60_000)).allowed).toBe(true);
    expect((await allowRequest(key, 1, 1, 60_000)).allowed).toBe(false);
  });
});
