type Labels = Record<string, string>;

type Series = { name: string; labels: Labels; value: number };

const counters = new Map<string, Series>();
const histogramSums = new Map<string, Series>();
const histogramCounts = new Map<string, Series>();
const gauges = new Map<string, Series>();

function key(name: string, labels: Labels) {
  return `${name}|${Object.entries(labels).sort(([a], [b]) => a.localeCompare(b)).map(([label, value]) => `${label}=${value}`).join(",")}`;
}

function remember(store: Map<string, Series>, name: string, labels: Labels, next: number) {
  store.set(key(name, labels), { name, labels, value: next });
}

export function incrementCounter(name: string, labels: Labels = {}, by = 1) {
  const current = counters.get(key(name, labels))?.value ?? 0;
  remember(counters, name, labels, current + by);
}

export function observeHistogram(name: string, value: number, labels: Labels = {}) {
  const id = key(name, labels);
  remember(histogramSums, name, labels, (histogramSums.get(id)?.value ?? 0) + value);
  remember(histogramCounts, name, labels, (histogramCounts.get(id)?.value ?? 0) + 1);
}

export function adjustGauge(name: string, delta: number, labels: Labels = {}) {
  const current = gauges.get(key(name, labels))?.value ?? 0;
  remember(gauges, name, labels, current + delta);
}

export function recordHttp(route: string, method: string, status: number, durationMs: number) {
  const labels = { route, method, status: String(status) };
  incrementCounter("http_requests_total", labels);
  observeHistogram("http_request_duration_ms", durationMs, labels);
}

export function recordStream(event: "published" | "acked" | "reclaimed" | "failed", stream: string) {
  incrementCounter("redis_stream_events_total", { event, stream });
}

function formatLabels(labels: Labels) {
  const body = Object.entries(labels).map(([label, value]) => `${label}="${value}"`).join(",");
  return body ? `{${body}}` : "";
}

export function renderPrometheus() {
  const lines: string[] = [];
  for (const series of [...counters.values(), ...gauges.values()]) {
    lines.push(`${series.name}${formatLabels(series.labels)} ${series.value}`);
  }
  for (const series of histogramSums.values()) {
    lines.push(`${series.name}_sum${formatLabels(series.labels)} ${series.value}`);
  }
  for (const series of histogramCounts.values()) {
    lines.push(`${series.name}_count${formatLabels(series.labels)} ${series.value}`);
  }
  return `${lines.join("\n")}\n`;
}
