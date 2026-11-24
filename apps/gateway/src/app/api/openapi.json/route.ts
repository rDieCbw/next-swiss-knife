import document from "@swiss/contracts/openapi.json";

export async function GET() {
  return Response.json(document);
}
