import { readFile } from "node:fs/promises";
import path from "node:path";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!/^[a-z0-9-]+$/i.test(id)) return new Response("bad id", { status: 400 });
  const file = await readFile(path.join(process.cwd(), "data", "media", `${id}.mp4`));
  return new Response(file, { headers: { "content-type": "video/mp4" } });
}
