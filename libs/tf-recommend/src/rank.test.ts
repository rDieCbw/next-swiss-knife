import { describe, expect, it } from "vitest";
import { rankSkus } from "./rank";

describe("rankSkus", () => {
  it("orders skus by recent interactions and breaks ties by sku", () => {
    expect(rankSkus(["sensor-24", "press-100", "reel-8"], { "press-100": 2, "reel-8": 2 })).toEqual([
      "press-100",
      "reel-8",
      "sensor-24",
    ]);
  });

  it("returns a copy and leaves the input array in place", () => {
    const skus = ["b", "a"];
    expect(rankSkus(skus, {})).toEqual(["a", "b"]);
    expect(skus).toEqual(["b", "a"]);
  });
});
