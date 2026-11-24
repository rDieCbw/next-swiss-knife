import { describe, expect, it } from "vitest";
import { nextMachineState } from "./machine";

describe("nextMachineState", () => {
  it("moves from idle to running when the press warms up", () => {
    expect(nextMachineState("idle", 45)).toBe("running");
  });

  it("raises an alarm at the high threshold", () => {
    expect(nextMachineState("running", 80)).toBe("alarm");
  });

  it("returns to idle after the alarm cools down", () => {
    expect(nextMachineState("alarm", 69)).toBe("idle");
  });

  it("keeps running inside the working band", () => {
    expect(nextMachineState("running", 55)).toBe("running");
  });
});
