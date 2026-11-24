import { listProducts, listStories } from "@swiss/data-mongo";
import { guard } from "@/server/guard";

export async function GET(request: Request) {
  const access = await guard(request, "tenant");
  if (!access.ok) {
    return Response.json(access, { status: access.status });
  }
  const [products, stories] = await Promise.all([listProducts(), listStories()]);
  return Response.json({ products, stories });
}
