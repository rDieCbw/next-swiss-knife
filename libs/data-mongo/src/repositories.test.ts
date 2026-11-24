import { MongoMemoryReplSet } from "mongodb-memory-server";
import { afterAll, beforeAll, expect, it } from "vitest";
import { closeDb } from "./client";
import { listProducts, saveLead } from "./repositories";

let replSet: MongoMemoryReplSet | undefined;

beforeAll(async () => {
  replSet = await MongoMemoryReplSet.create({ replSet: { count: 1, storageEngine: "wiredTiger" } });
  process.env.MONGODB_URI = replSet.getUri();
  process.env.MONGODB_DB = "swiss-test";
}, 120_000);

afterAll(async () => {
  await closeDb();
  await replSet?.stop();
});

it("writes a lead and reads the seeded catalog", async () => {
  await saveLead({ name: "Ada", email: "ada@example.com" });
  const products = await listProducts();
  expect(products.map((product) => product.sku)).toContain("press-100");
}, 120_000);
