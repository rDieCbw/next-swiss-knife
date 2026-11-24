import { toNextJsHandler } from "better-auth/next-js";
import { connectAuthDb, getAuth } from "@/lib/auth";

let cached: ReturnType<typeof toNextJsHandler> | undefined;

async function handler() {
  await connectAuthDb();
  cached ??= toNextJsHandler(getAuth());
  return cached;
}

export async function GET(request: Request) {
  const auth = await handler();
  return auth.GET(request);
}

export async function POST(request: Request) {
  const auth = await handler();
  return auth.POST(request);
}
