import { listMessages } from "@swiss/data-mongo";

export async function GET(request: Request) {
  const room = new URL(request.url).searchParams.get("room") ?? "lobby";
  return Response.json(await listMessages(room));
}
