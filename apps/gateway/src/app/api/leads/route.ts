import { leadSchema } from "@swiss/contracts";
import { allowRequest } from "@swiss/cache-redis";
import { saveLead } from "@swiss/data-mongo";

export async function POST(request: Request) {
  const limit = await allowRequest("leads", 10, 1, 1000);
  if (!limit.allowed) {
    return Response.json({ reason: "rate-limited" }, { status: 429 });
  }
  const lead = leadSchema.parse(await request.json());
  return Response.json(await saveLead(lead), { status: 201 });
}
