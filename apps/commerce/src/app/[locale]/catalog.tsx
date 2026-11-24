"use client";

import type { Product } from "@swiss/contracts";
import { useState } from "react";
import { useCart } from "@/cart";
import { checkout } from "./actions";

export function Catalog({ products, tenantId }: { products: Product[]; tenantId: string }) {
  const lines = useCart((state) => state.lines);
  const add = useCart((state) => state.add);
  const [status, setStatus] = useState("");
  return (
    <>
      {products.map((product) => (
        <article className="card" key={product.sku}>
          <h2>{product.title}</h2>
          <p>{product.summary}</p>
          <p>{(product.priceCents / 100).toFixed(2)}</p>
          <button type="button" onClick={() => add(product.sku)}>Add</button>
        </article>
      ))}
      <p role="status">{lines.map((line) => `${line.sku} x${line.quantity}`).join(", ")}</p>
      <button type="button" onClick={async () => {
        try {
          const order = await checkout(tenantId, lines);
          setStatus(order.id);
        } catch (error) {
          setStatus(error instanceof Error ? error.message : "failed");
        }
      }}>Checkout</button>
      <p className="live" role="status">{status}</p>
    </>
  );
}
