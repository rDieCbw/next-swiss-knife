import { getRedis } from "./client";

const script = `
local key = KEYS[1]
local capacity = tonumber(ARGV[1])
local refill = tonumber(ARGV[2])
local interval = tonumber(ARGV[3])
local now = tonumber(ARGV[4])
local state = redis.call('HMGET', key, 'tokens', 'ts')
local tokens = tonumber(state[1])
local ts = tonumber(state[2])
if tokens == nil then
  tokens = capacity
  ts = now
end
local elapsed = math.max(0, now - ts)
local steps = math.floor(elapsed / interval)
if steps > 0 then
  tokens = math.min(capacity, tokens + (steps * refill))
  ts = ts + (steps * interval)
end
local allowed = 0
if tokens >= 1 then
  tokens = tokens - 1
  allowed = 1
end
redis.call('HSET', key, 'tokens', tokens, 'ts', ts)
redis.call('PEXPIRE', key, interval * capacity)
return { allowed, tokens }
`;

export async function allowRequest(key: string, capacity = 20, refill = 1, intervalMs = 1000) {
  const redis = await getRedis();
  const result = (await redis.eval(script, {
    keys: [`rate:${key}`],
    arguments: [String(capacity), String(refill), String(intervalMs), String(Date.now())],
  })) as [number, number];
  return { allowed: result[0] === 1, remaining: result[1] };
}
