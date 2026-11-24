import { listMachines } from "@swiss/contracts/api";
import { Board } from "./client-widgets";

export default async function IndustrialHome() {
  let machines: Awaited<ReturnType<typeof listMachines>> = [];
  try { machines = await listMachines(); } catch { machines = []; }
  return <Board initial={machines} />;
}
