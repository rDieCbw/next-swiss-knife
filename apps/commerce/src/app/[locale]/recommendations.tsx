"use client";

import { rankInWorker } from "@swiss/tf-recommend/browser";
import { rankSkus } from "@swiss/tf-recommend";
import { useEffect, useState } from "react";
import { useCart } from "@/cart";

export function Recommendations({ skus }: { skus: string[] }) {
  const interactions = useCart((state) => state.interactions);
  const [ranked, setRanked] = useState(skus);
  useEffect(() => {
    let cancelled = false;
    rankInWorker(skus, interactions).then((next) => {
      if (!cancelled) setRanked(next.length ? next : rankSkus(skus, interactions));
    });
    return () => { cancelled = true; };
  }, [skus, interactions]);
  return (
    <ol>
      {ranked.map((sku) => <li key={sku}>{sku}</li>)}
    </ol>
  );
}
