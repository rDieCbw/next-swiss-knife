import type { MachineState } from "./schemas";

export function nextMachineState(state: MachineState, temperature: number): MachineState {
  if (temperature >= 80) {
    return "alarm";
  }
  if (state === "alarm" && temperature < 70) {
    return "idle";
  }
  if (state === "idle" && temperature >= 40) {
    return "running";
  }
  if (state === "running" && temperature < 30) {
    return "idle";
  }
  return state;
}
