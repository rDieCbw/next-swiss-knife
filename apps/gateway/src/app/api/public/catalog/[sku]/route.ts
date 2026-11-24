import { getProduct } from "@swiss/data-mongo";

export async function GET(_request: Request, context: { params: Promise<{ sku: string }> }) {
  const { sku } = await context.params;
  const product = await getProduct(sku);
  if (!product) {
    return Response.json({ reason: "not-found" }, { status: 404 });
  }
  return Response.json(product);
}
