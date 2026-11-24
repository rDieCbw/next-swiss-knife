import type { RedisClientType } from "redis";
import { getContext } from "@swiss/observability";
import { getRedis } from "./client";

const channels = new Map<string, { client: RedisClientType; listeners: Set<(message: unknown) => void> }>();

export async function publish(channel: string, message: unknown) {
  const context = getContext();
  const body =
    typeof message === "object" && message !== null && !Array.isArray(message)
      ? { requestId: context.requestId, traceId: context.traceId, tenantId: context.tenantId, ...message }
      : { message, requestId: context.requestId, traceId: context.traceId, tenantId: context.tenantId };
  return (await getRedis()).publish(channel, JSON.stringify(body));
}

export async function subscribe(channel: string, onMessage: (message: unknown) => void) {
  const current = channels.get(channel);
  if (current) {
    current.listeners.add(onMessage);
    return () => current.listeners.delete(onMessage);
  }

  const listeners = new Set<(message: unknown) => void>([onMessage]);
  const subscriber = (await getRedis()).duplicate();
  subscriber.on("error", () => {
    // The caller sees a closed stream when Redis drops the subscription.
  });
  await subscriber.connect();
  await subscriber.subscribe(channel, (raw) => {
    let parsed: unknown = raw;
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = raw;
    }
    for (const listener of listeners) {
      listener(parsed);
    }
  });
  channels.set(channel, { client: subscriber, listeners });
  return () => listeners.delete(onMessage);
}
