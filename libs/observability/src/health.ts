export async function readyResponse(service: string, checks: Record<string, () => Promise<unknown>> = {}) {
  const failures: string[] = [];
  await Promise.all(
    Object.entries(checks).map(async ([name, check]) => {
      try {
        await Promise.race([
          check(),
          new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 500)),
        ]);
      } catch {
        failures.push(name);
      }
    }),
  );
  if (failures.length > 0) {
    return Response.json({ status: "unavailable", service, failures }, { status: 503 });
  }
  return Response.json({ status: "ok", service });
}

export function liveResponse(service: string) {
  return Response.json({ status: "ok", service });
}
