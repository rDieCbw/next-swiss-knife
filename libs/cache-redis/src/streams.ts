import { recordStream, streamEnvelope } from "@swiss/observability";
import { getRedis } from "./client";

export async function publishEvent(stream: string, type: string, payload: unknown) {
  try {
    const id = await (await getRedis()).xAdd(stream, "*", streamEnvelope(type, payload));
    recordStream("published", stream);
    return id;
  } catch (error) {
    recordStream("failed", stream);
    throw error;
  }
}

export async function ensureGroup(stream: string, group: string) {
  const redis = await getRedis();
  try {
    await redis.xGroupCreate(stream, group, "0", { MKSTREAM: true });
  } catch (error) {
    if (!(error instanceof Error) || !error.message.includes("BUSYGROUP")) {
      throw error;
    }
  }
}

export async function readGroup(stream: string, group: string, consumer: string) {
  const redis = await getRedis();
  const rows = await redis.xReadGroup(group, consumer, [{ key: stream, id: ">" }], { COUNT: 20, BLOCK: 50 });
  if (!rows) {
    return [];
  }
  return rows.flatMap((row) =>
    row.messages.map((message: { id: string; message: Record<string, string> }) => ({
      id: message.id,
      type: message.message.type ?? "",
      payload: message.message.payload ?? "{}",
      requestId: message.message.requestId ?? "",
      traceId: message.message.traceId ?? "",
      tenantId: message.message.tenantId ?? "",
    })),
  );
}

export async function acknowledge(stream: string, group: string, id: string) {
  await (await getRedis()).xAck(stream, group, id);
  recordStream("acked", stream);
}

export async function claimStale(stream: string, group: string, consumer: string, minIdleMs = 30_000) {
  const redis = await getRedis();
  const result = await redis.xAutoClaim(stream, group, consumer, minIdleMs, "0-0", { COUNT: 20 });
  if (result.messages.length > 0) recordStream("reclaimed", stream);
  return result.messages;
}
