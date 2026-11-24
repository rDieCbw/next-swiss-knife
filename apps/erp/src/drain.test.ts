import { describe, expect, it } from "vitest";
import { contextForEvent } from "./drain";

describe("contextForEvent", () => {
  it("keeps the request, trace and tenant from the stream envelope", () => {
    expect(
      contextForEvent({
        requestId: "req-1",
        traceId: "ab".repeat(16),
        tenantId: "org-1",
        payload: JSON.stringify({ id: "order-1", organizationId: "org-1" }),
      }),
    ).toEqual({ requestId: "req-1", traceId: "ab".repeat(16), tenantId: "org-1" });
  });
});
