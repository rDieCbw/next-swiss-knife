import { recordRecommendation } from "@swiss/observability/browser";
import { rankSkus } from "./rank";

function finish(started: number, fallback: boolean, ranked: string[]) {
  recordRecommendation(performance.now() - started, fallback);
  return ranked;
}

export function rankInWorker(skus: string[], interactions: Record<string, number>) {
  const started = performance.now();
  if (typeof Worker === "undefined") {
    return Promise.resolve(finish(started, true, rankSkus(skus, interactions)));
  }

  return new Promise<string[]>((resolve) => {
    let worker: Worker;
    try {
      worker = new Worker(new URL("./recommend.worker.ts", import.meta.url));
    } catch {
      resolve(finish(started, true, rankSkus(skus, interactions)));
      return;
    }

    const timer = setTimeout(() => {
      worker.terminate();
      resolve(finish(started, true, rankSkus(skus, interactions)));
    }, 4000);

    worker.onmessage = (event: MessageEvent<string[]>) => {
      clearTimeout(timer);
      worker.terminate();
      resolve(finish(started, false, event.data));
    };
    worker.onerror = () => {
      clearTimeout(timer);
      worker.terminate();
      resolve(finish(started, true, rankSkus(skus, interactions)));
    };
    worker.postMessage({ skus, interactions });
  });
}
