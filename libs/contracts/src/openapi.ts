import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  extendZodWithOpenApi,
  OpenApiGeneratorV31,
  OpenAPIRegistry,
} from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import {
  auditSchema,
  leadSchema,
  mediaSchema,
  messageSchema,
  orderSchema,
  productSchema,
  storefrontSchema,
  storySchema,
  cartLineSchema,
  machineSchema,
} from "./schemas";

extendZodWithOpenApi(z);

const registry = new OpenAPIRegistry();
const json = (schema: z.ZodType) => ({
  description: "JSON body",
  content: { "application/json": { schema } },
});

registry.registerPath({
  method: "get",
  path: "/api/public/stories",
  responses: { 200: json(z.array(storySchema)) },
});
registry.registerPath({
  method: "get",
  path: "/api/public/stories/{slug}",
  request: { params: z.object({ slug: z.string() }) },
  responses: { 200: json(storySchema) },
});
registry.registerPath({
  method: "get",
  path: "/api/public/catalog",
  responses: { 200: json(z.array(productSchema)) },
});
registry.registerPath({
  method: "get",
  path: "/api/public/catalog/{sku}",
  request: { params: z.object({ sku: z.string() }) },
  responses: { 200: json(productSchema) },
});
registry.registerPath({
  method: "post",
  path: "/api/leads",
  request: { body: { content: { "application/json": { schema: leadSchema } } } },
  responses: { 201: json(leadSchema) },
});
registry.registerPath({
  method: "get",
  path: "/api/bff/storefront",
  responses: { 200: json(storefrontSchema) },
});
registry.registerPath({
  method: "post",
  path: "/api/orders",
  request: {
    body: { content: { "application/json": { schema: z.object({ lines: z.array(cartLineSchema) }) } } },
  },
  responses: { 201: json(orderSchema) },
});
registry.registerPath({
  method: "get",
  path: "/api/orders",
  responses: { 200: json(z.array(orderSchema)) },
});
registry.registerPath({
  method: "get",
  path: "/api/audit",
  responses: { 200: json(z.array(auditSchema)) },
});
registry.registerPath({
  method: "get",
  path: "/api/machines",
  responses: { 200: json(z.array(machineSchema)) },
});
registry.registerPath({
  method: "get",
  path: "/api/media",
  responses: { 200: json(z.array(mediaSchema)) },
});
registry.registerPath({
  method: "get",
  path: "/api/messages",
  request: { query: z.object({ room: z.string() }) },
  responses: { 200: json(z.array(messageSchema)) },
});

const document = new OpenApiGeneratorV31(registry.definitions).generateDocument({
  openapi: "3.1.0",
  info: {
    title: "Swiss Gateway",
    version: "1.0.0",
    description: "HTTP contract for the modular Next.js scaffold.",
  },
  servers: [{ url: "http://localhost:3000" }],
});

const output = resolve(dirname(fileURLToPath(import.meta.url)), "../openapi.json");
writeFileSync(output, JSON.stringify(document, null, 2));
console.log(`wrote ${output}`);
