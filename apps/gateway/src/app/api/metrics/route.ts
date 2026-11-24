import { renderPrometheus } from "@swiss/observability";

export function GET(request: Request) {
  if (process.env.METRICS_ENABLED !== "true") {
    return new Response("metrics disabled", { status: 404 });
  }
  if (!process.env.METRICS_TOKEN || request.headers.get("x-metrics-key") !== process.env.METRICS_TOKEN) {
    return new Response("unauthorized", { status: 401 });
  }
  return new Response(renderPrometheus(), {
    headers: { "content-type": "text/plain; version=0.0.4" },
  });
}
