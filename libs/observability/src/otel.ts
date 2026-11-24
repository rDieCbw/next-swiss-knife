export async function registerTelemetry(serviceName: string) {
  if (process.env.OTEL_ENABLED !== "true") return;
  const [{ NodeSDK }, { OTLPTraceExporter }, { resourceFromAttributes }, conventions] = await Promise.all([
    import("@opentelemetry/sdk-node"),
    import("@opentelemetry/exporter-trace-otlp-http"),
    import("@opentelemetry/resources"),
    import("@opentelemetry/semantic-conventions"),
  ]);
  const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT ?? "http://127.0.0.1:4318/v1/traces";
  const sdk = new NodeSDK({
    resource: resourceFromAttributes({
      [conventions.ATTR_SERVICE_NAME]: process.env.OTEL_SERVICE_NAME ?? serviceName,
    }),
    traceExporter: new OTLPTraceExporter({ url: endpoint }),
  });
  sdk.start();
}
