import { request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";
import {
  auditSchema,
  cartLineSchema,
  leadSchema,
  mediaSchema,
  messageSchema,
  orderSchema,
  productListSchema,
  productSchema,
  storefrontSchema,
  storySchema,
  machineSchema,
  type CartLine,
  type Lead,
} from "./schemas";

const gateway = () => process.env.GATEWAY_URL ?? process.env.NEXT_PUBLIC_GATEWAY_URL ?? "http://localhost:3000";

function readJson(url: string, init: { method?: string; headers: Headers; body?: string }) {
  return new Promise<unknown>((resolve, reject) => {
    const target = new URL(url);
    const transport = target.protocol === "https:" ? httpsRequest : httpRequest;
    const req = transport(
      target,
      {
        method: init.method ?? "GET",
        headers: Object.fromEntries(init.headers),
        timeout: 800,
      },
      (response) => {
        const chunks: Buffer[] = [];
        response.on("data", (chunk: Buffer) => chunks.push(chunk));
        response.on("end", () => {
          try {
            const text = Buffer.concat(chunks).toString("utf8");
            const body = text ? JSON.parse(text) : null;
            if ((response.statusCode ?? 500) >= 400) {
              const reason = body && typeof body === "object" && "reason" in body ? String(body.reason) : `http-${response.statusCode}`;
              reject(new Error(reason));
              return;
            }
            resolve(body);
          } catch (error) {
            reject(error);
          }
        });
      },
    );
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("timeout"));
    });
    req.on("error", reject);
    if (init.body) req.write(init.body);
    req.end();
  });
}

async function request(path: string, init?: RequestInit, tenantId?: string) {
  const headers = new Headers(init?.headers);
  headers.set("accept", "application/json");
  if (init?.body) {
    headers.set("content-type", "application/json");
  }
  if (tenantId) {
    headers.set("x-tenant-id", tenantId);
  }
  return readJson(`${gateway()}${path}`, {
    method: init?.method,
    headers,
    body: typeof init?.body === "string" ? init.body : undefined,
  });
}

const revalidate = { next: { revalidate: 3600 } } as RequestInit;

export async function getStories() {
  return storySchema.array().parse(await request("/api/public/stories", revalidate));
}

export async function getStory(slug: string) {
  return storySchema.parse(await request(`/api/public/stories/${encodeURIComponent(slug)}`, revalidate));
}

export async function getCatalog() {
  return productListSchema.parse(await request("/api/public/catalog", revalidate));
}

export async function getProduct(sku: string) {
  return productSchema.parse(await request(`/api/public/catalog/${encodeURIComponent(sku)}`, revalidate));
}

export async function createLead(lead: Lead) {
  return leadSchema.parse(
    await request("/api/leads", { method: "POST", body: JSON.stringify(leadSchema.parse(lead)) }),
  );
}

export async function getStorefront(tenantId: string, cookie?: string) {
  return storefrontSchema.parse(
    await request("/api/bff/storefront", { headers: cookie ? { cookie } : undefined }, tenantId),
  );
}

export async function createOrder(tenantId: string, lines: CartLine[], cookie: string) {
  return orderSchema.parse(
    await request(
      "/api/orders",
      { method: "POST", headers: { cookie }, body: JSON.stringify({ lines: cartLineSchema.array().parse(lines) }) },
      tenantId,
    ),
  );
}

export async function listOrders(tenantId: string, cookie: string) {
  return orderSchema.array().parse(await request("/api/orders", { headers: { cookie } }, tenantId));
}

export async function listAudit(tenantId: string, cookie: string) {
  return auditSchema.array().parse(await request("/api/audit", { headers: { cookie } }, tenantId));
}

export async function listMachines() {
  return machineSchema.array().parse(await request("/api/machines"));
}

export async function listMedia() {
  return mediaSchema.array().parse(await request("/api/media"));
}

export async function listMessages(room: string) {
  return messageSchema.array().parse(await request(`/api/messages?room=${encodeURIComponent(room)}`));
}
