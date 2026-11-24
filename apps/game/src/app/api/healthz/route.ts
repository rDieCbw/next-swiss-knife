import { liveResponse } from "@swiss/observability";

export function GET() {
  return liveResponse("game");
}
