import { AsyncLocalStorage } from "node:async_hooks";
import { randomBytes, randomUUID } from "node:crypto";

export type RequestContext = {
  requestId?: string;
  traceId?: string;
  tenantId?: string;
  userId?: string;
};

const storage = new AsyncLocalStorage<RequestContext>();

export function getContext(): RequestContext {
  return storage.getStore() ?? {};
}

export function runWithContext<T>(context: RequestContext, fn: () => T): T {
  return storage.run({ ...getContext(), ...context }, fn);
}

export function traceIdFromTraceparent(header: string | null): string | undefined {
  if (!header) return undefined;
  const parts = header.split("-");
  if (parts.length < 4 || parts[1]?.length !== 32) return undefined;
  return parts[1];
}

export function createTraceparent() {
  const traceId = randomBytes(16).toString("hex");
  const spanId = randomBytes(8).toString("hex");
  return `00-${traceId}-${spanId}-01`;
}

export function contextFromHeaders(headers: Headers, userId?: string | null): RequestContext {
  return {
    requestId: headers.get("x-request-id") ?? randomUUID(),
    traceId: traceIdFromTraceparent(headers.get("traceparent")),
    tenantId: headers.get("x-tenant-id") ?? undefined,
    userId: userId ?? undefined,
  };
}

export function streamEnvelope(type: string, payload: unknown, context: RequestContext = getContext()) {
  return {
    type,
    payload: JSON.stringify(payload),
    requestId: context.requestId ?? "",
    traceId: context.traceId ?? "",
    tenantId: context.tenantId ?? "",
  };
}
