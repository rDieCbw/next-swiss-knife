import { Writable } from "node:stream";
import { describe, expect, it } from "vitest";
import { createLogger } from "./logger";
import { runWithContext, streamEnvelope, traceIdFromTraceparent } from "./context";
import { recordHttp, recordStream, renderPrometheus } from "./metrics";
import { registerTelemetry } from "./otel";

function capture() {
  const lines: string[] = [];
  const destination = new Writable({
    write(chunk, _encoding, callback) {
      lines.push(chunk.toString());
      callback();
    },
  });
  return { lines, destination };
}

describe("logger", () => {
  it("redacts secrets and writes the required fields", () => {
    const { lines, destination } = capture();
    const logger = createLogger("gateway", destination);
    logger.info({ password: "hunter2", token: "abc", nested: { secret: "hide", cookie: "session" } }, "sign-in");
    const parsed = JSON.parse(lines[0] ?? "{}") as Record<string, unknown>;
    expect(parsed.level).toBe("info");
    expect(parsed.service).toBe("gateway");
    expect(parsed.env).toBeDefined();
    expect(parsed.timestamp).toEqual(expect.any(String));
    expect(parsed.msg).toBe("sign-in");
    expect(parsed.password).toBe("[REDACTED]");
    expect(parsed.token).toBe("[REDACTED]");
    expect((parsed.nested as { secret: string; cookie: string }).secret).toBe("[REDACTED]");
    expect((parsed.nested as { cookie: string }).cookie).toBe("[REDACTED]");
  });

  it("adds the active request context", () => {
    const { lines, destination } = capture();
    const logger = createLogger("erp", destination);
    runWithContext({ requestId: "req-1", traceId: "a".repeat(32), tenantId: "org-1", userId: "user-1" }, () => {
      logger.info("order consumed");
    });
    const parsed = JSON.parse(lines[0] ?? "{}") as Record<string, string>;
    expect(parsed.requestId).toBe("req-1");
    expect(parsed.traceId).toBe("a".repeat(32));
    expect(parsed.tenantId).toBe("org-1");
    expect(parsed.userId).toBe("user-1");
  });
});

describe("correlation", () => {
  it("reads a W3C trace id", () => {
    expect(traceIdFromTraceparent(`00-${"ab".repeat(16)}-${"cd".repeat(8)}-01`)).toBe("ab".repeat(16));
  });

  it("keeps the same request, trace and tenant on a stream envelope", () => {
    const envelope = runWithContext({ requestId: "req-9", traceId: "ff".repeat(16), tenantId: "org-9" }, () =>
      streamEnvelope("order.placed", { id: "order-1" }),
    );
    expect(envelope).toMatchObject({
      type: "order.placed",
      requestId: "req-9",
      traceId: "ff".repeat(16),
      tenantId: "org-9",
    });
    expect(JSON.parse(envelope.payload)).toEqual({ id: "order-1" });
  });
});

describe("metrics and telemetry", () => {
  it("renders http and stream series", () => {
    recordHttp("/api/orders", "POST", 201, 12);
    recordStream("published", "stream:orders");
    const text = renderPrometheus();
    expect(text).toContain('http_requests_total{route="/api/orders",method="POST",status="201"} 1');
    expect(text).toContain('redis_stream_events_total{event="published",stream="stream:orders"} 1');
    expect(text).toContain("http_request_duration_ms_sum");
  });

  it("does not start OpenTelemetry when it is disabled", async () => {
    process.env.OTEL_ENABLED = "false";
    await expect(registerTelemetry("gateway")).resolves.toBeUndefined();
  });
});
