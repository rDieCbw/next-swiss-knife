import { createClient, type RedisClientType } from "redis";

let client: RedisClientType | undefined;
let connecting: Promise<RedisClientType> | undefined;

export function redisUrl() {
  const url = process.env.REDIS_URL;
  if (!url) {
    throw new Error("REDIS_URL is required");
  }
  return url;
}

export async function getRedis() {
  if (!connecting) {
    client = createClient({ url: redisUrl() });
    client.on("error", () => {
      // Callers observe command failures. The listener keeps the process alive.
    });
    connecting = client.connect().then(() => client!);
  }
  return connecting;
}

export async function closeRedis() {
  if (client?.isOpen) {
    await client.quit();
  }
  client = undefined;
  connecting = undefined;
}
