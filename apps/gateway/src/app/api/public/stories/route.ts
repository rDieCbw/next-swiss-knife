import { listStories } from "@swiss/data-mongo";

export async function GET() {
  return Response.json(await listStories());
}
