import { getStory } from "@swiss/data-mongo";

export async function GET(_request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const story = await getStory(slug);
  if (!story) {
    return Response.json({ reason: "not-found" }, { status: 404 });
  }
  return Response.json(story);
}
