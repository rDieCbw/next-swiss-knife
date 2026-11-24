import { getRedis } from "./client";

export async function cacheGet(key: string) {
  return (await getRedis()).get(key);
}

export async function cacheSet(key: string, value: string, ttlSeconds = 60) {
  await (await getRedis()).set(key, value, { EX: ttlSeconds });
}
