type ClientReport = {
  kind: "error" | "unhandledrejection" | "http";
  message: string;
  route?: string;
  locale?: string;
  tenantId?: string | null;
  requestId?: string | null;
};

const recommendation = { inferences: 0, fallbacks: 0, lastDurationMs: 0 };
const installed = new WeakSet<object>();

export function recordRecommendation(durationMs: number, fallback: boolean) {
  recommendation.inferences += 1;
  recommendation.lastDurationMs = durationMs;
  if (fallback) recommendation.fallbacks += 1;
}

export function recommendationStats() {
  return { ...recommendation };
}

export function reportClientError(report: ClientReport) {
  if (typeof fetch === "undefined") return Promise.resolve();
  const base = typeof process !== "undefined" ? process.env.NEXT_PUBLIC_GATEWAY_URL : undefined;
  const url = base ? `${base}/api/client-errors` : "/api/client-errors";
  return fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(report),
    keepalive: true,
  }).catch(() => undefined);
}

export function installClientErrorReporting(tenantId?: string | null) {
  if (typeof window === "undefined") return;
  if (installed.has(window)) return;
  installed.add(window);
  const send = (kind: ClientReport["kind"], message: string) => {
    const parts = window.location.pathname.split("/");
    void reportClientError({
      kind,
      message,
      route: window.location.pathname,
      locale: parts[1],
      tenantId: tenantId ?? null,
    });
  };
  window.addEventListener("error", (event) => send("error", event.message));
  window.addEventListener("unhandledrejection", (event) => send("unhandledrejection", String(event.reason)));
}
