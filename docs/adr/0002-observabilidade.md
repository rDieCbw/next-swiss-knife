# ADR-0002: Distributed observability

Status: accepted. Date: 2026-11-24. Complements ADR-0001.

The `@swiss/observability` package centralizes JSON logs with redaction, correlation (`requestId`, `traceId`, `tenantId`, `userId`), and optional OpenTelemetry setup. The `./browser` entry does not load Pino or OpenTelemetry. Marketing imports only that entry.

Logs are JSON, one event per line. `info` and `debug` go to stdout. `warn` and `error` go to stderr. Sensitive fields (`password`, `token`, `accessToken`, `refreshToken`, `authorization`, `cookie`, `secret`) become `[REDACTED]`.

The gateway keeps `x-request-id` and `traceparent`. Redis Streams and Pub/Sub carry `requestId`, `traceId`, and `tenantId`. The ERP consumer reopens that context in its log.

`OTEL_ENABLED=false` by default. When it is `true`, spans go over OTLP/HTTP to `OTEL_EXPORTER_OTLP_ENDPOINT`.

`GET /api/healthz` returns `{ status: "ok", service }`. `GET /api/readyz` does a short ping of Mongo and Redis when the service depends on them. Compose uses those endpoints. The `observability` profile starts Collector, Tempo, Loki, and Grafana, and it is not part of the minimal bootstrap.

`GET /api/metrics` answers only when `METRICS_ENABLED=true` and the `x-metrics-key` header is present. Browser errors go to `POST /api/client-errors`, behind a rate limit. Playwright fails on `pageerror`, console messages at `error` level, and responses with status `>= 500`.
