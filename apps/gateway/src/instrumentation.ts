import { registerTelemetry } from "@swiss/observability/otel";

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  await registerTelemetry("gateway");
}
