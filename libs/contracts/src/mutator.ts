let tenantId: string | null = null;

export function setTenantId(next: string | null) {
  tenantId = next;
}

export function getTenantId() {
  return tenantId;
}

export async function customFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  const base = process.env.NEXT_PUBLIC_GATEWAY_URL ?? "http://localhost:3000";
  const target = url.startsWith("http") ? url : new URL(url, base).toString();
  const headers = new Headers(options.headers);
  headers.set("accept", "application/json");
  if (options.body) {
    headers.set("content-type", "application/json");
  }
  if (tenantId) {
    headers.set("x-tenant-id", tenantId);
  }

  const response = await fetch(target, {
    ...options,
    headers,
    credentials: "include",
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const reason = data && typeof data === "object" && "reason" in data ? String(data.reason) : `http-${response.status}`;
    if (typeof window !== "undefined" && response.status >= 500) {
      const { reportClientError } = await import("@swiss/observability/browser");
      void reportClientError({
        kind: "http",
        message: reason,
        route: url,
        requestId: response.headers.get("x-request-id"),
      });
    }
    throw new Error(reason);
  }
  return { data, status: response.status, headers: response.headers } as T;
}
