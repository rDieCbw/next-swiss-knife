import { listProducts } from "@swiss/data-mongo";

export async function GET() {
  return Response.json(await listProducts());
}
