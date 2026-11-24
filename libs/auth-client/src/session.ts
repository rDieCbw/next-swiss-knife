export type SessionPayload = {
  user: { id: string; email: string; name: string };
  session: { id: string; activeOrganizationId?: string | null };
};

export async function fetchSession(cookie: string): Promise<SessionPayload | null> {
  const base = process.env.AUTH_URL ?? "http://localhost:3001";
  const response = await fetch(`${base}/api/auth/get-session`, {
    headers: { cookie },
    cache: "no-store",
  });
  if (!response.ok) {
    return null;
  }
  const body = (await response.json()) as SessionPayload | null;
  if (!body?.user) {
    return null;
  }
  return body;
}
