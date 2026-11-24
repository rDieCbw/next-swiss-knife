/// <reference lib="webworker" />

import { rankWithTensorflow } from "./tensorflow";
import { rankSkus } from "./rank";

declare const self: DedicatedWorkerGlobalScope;

self.onmessage = async (event: MessageEvent<{ skus: string[]; interactions: Record<string, number> }>) => {
  try {
    const ranked = await rankWithTensorflow(event.data.skus, event.data.interactions);
    self.postMessage(ranked);
  } catch {
    self.postMessage(rankSkus(event.data.skus, event.data.interactions));
  }
};
