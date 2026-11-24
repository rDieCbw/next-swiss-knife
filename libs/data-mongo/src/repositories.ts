import { randomUUID } from "node:crypto";
import type {
  AuditEntry,
  CartLine,
  ChatMessage,
  Lead,
  Machine,
  MediaItem,
  Order,
  Product,
  Story,
} from "@swiss/contracts";
import { getDb } from "./client";

const products: Product[] = [
  { sku: "press-100", title: "Prensa hidráulica 100t", summary: "Prensa de oficina para lotes curtos.", priceCents: 2500000 },
  { sku: "sensor-24", title: "Sensor de temperatura", summary: "Sonda para telemetria industrial.", priceCents: 8900 },
  { sku: "reel-8", title: "Rolo de mídia 8mm", summary: "Mídia de demonstração para o player.", priceCents: 4200 },
];

const stories: Story[] = [
  {
    slug: "prensa-hidraulica",
    title: "Como a prensa entra na linha",
    body: "A oficina publica o catálogo, o pedido atravessa o stream e o ERP registra a auditoria.",
  },
];

async function collection<T extends object>(name: string) {
  const db = await getDb();
  return db.collection<T>(name);
}

export async function ensureCatalog() {
  const productsCollection = await collection<Product & { id: string }>("products");
  if ((await productsCollection.countDocuments()) === 0) {
    await productsCollection.insertMany(products.map((product) => ({ ...product, id: product.sku })));
  }
  const storiesCollection = await collection<Story & { id: string }>("stories");
  if ((await storiesCollection.countDocuments()) === 0) {
    await storiesCollection.insertMany(stories.map((story) => ({ ...story, id: story.slug })));
  }
  const machines = await collection<Machine>("machines");
  if ((await machines.countDocuments()) === 0) {
    await machines.insertOne({ id: "press-1", name: "Prensa 1", state: "idle", temperature: 22 });
  }
}

export async function listProducts(): Promise<Product[]> {
  await ensureCatalog();
  const rows = await (await collection<Product>("products")).find({}, { projection: { _id: 0 } }).toArray();
  return rows;
}

export async function getProduct(sku: string): Promise<Product | null> {
  await ensureCatalog();
  return (await collection<Product>("products")).findOne({ sku }, { projection: { _id: 0 } });
}

export async function listStories(): Promise<Story[]> {
  await ensureCatalog();
  return (await collection<Story>("stories")).find({}, { projection: { _id: 0 } }).toArray();
}

export async function getStory(slug: string): Promise<Story | null> {
  await ensureCatalog();
  return (await collection<Story>("stories")).findOne({ slug }, { projection: { _id: 0 } });
}

export async function saveLead(lead: Lead) {
  await (await collection<Lead & { id: string }>("leads")).insertOne({ ...lead, id: randomUUID() });
  return lead;
}

export async function saveOrder(organizationId: string, lines: CartLine[], catalog: Product[]): Promise<Order> {
  const totalCents = lines.reduce((sum, line) => {
    const product = catalog.find((item) => item.sku === line.sku);
    return sum + (product?.priceCents ?? 0) * line.quantity;
  }, 0);
  const order: Order = {
    id: randomUUID(),
    organizationId,
    lines,
    totalCents,
    createdAt: new Date().toISOString(),
  };
  await (await collection<Order>("orders")).insertOne(order);
  return order;
}

export async function listOrders(organizationId: string): Promise<Order[]> {
  return (await collection<Order>("orders"))
    .find({ organizationId }, { projection: { _id: 0 } })
    .sort({ createdAt: -1 })
    .toArray();
}

export async function saveAudit(entry: Omit<AuditEntry, "id" | "createdAt">): Promise<AuditEntry> {
  const stored: AuditEntry = { ...entry, id: randomUUID(), createdAt: new Date().toISOString() };
  await (await collection<AuditEntry>("audit")).insertOne(stored);
  return stored;
}

export async function listAudit(organizationId: string): Promise<AuditEntry[]> {
  return (await collection<AuditEntry>("audit"))
    .find({ organizationId }, { projection: { _id: 0 } })
    .sort({ createdAt: -1 })
    .toArray();
}

export async function listMachines(): Promise<Machine[]> {
  await ensureCatalog();
  return (await collection<Machine>("machines")).find({}, { projection: { _id: 0 } }).toArray();
}

export async function updateMachine(machine: Machine) {
  await (await collection<Machine>("machines")).updateOne({ id: machine.id }, { $set: machine }, { upsert: true });
}

export async function saveMedia(item: MediaItem) {
  await (await collection<MediaItem>("media")).updateOne({ id: item.id }, { $set: item }, { upsert: true });
}

export async function listMedia(): Promise<MediaItem[]> {
  return (await collection<MediaItem>("media")).find({}, { projection: { _id: 0 } }).toArray();
}

export async function saveMessage(message: ChatMessage) {
  await (await collection<ChatMessage>("messages")).insertOne(message);
}

export async function listMessages(room: string): Promise<ChatMessage[]> {
  return (await collection<ChatMessage>("messages"))
    .find({ room }, { projection: { _id: 0 } })
    .sort({ createdAt: 1 })
    .toArray();
}

export async function getMembership(organizationId: string, userId: string) {
  const db = await getDb();
  const member = await db.collection<{ role?: string }>("member").findOne({ organizationId, userId });
  return member;
}

export async function getMemberAttribute(organizationId: string, userId: string) {
  return (await collection<{ organizationId: string; userId: string; department: string }>("member_attributes")).findOne(
    { organizationId, userId },
    { projection: { _id: 0 } },
  );
}

export async function setMemberAttribute(organizationId: string, userId: string, department: string) {
  await (await collection<{ organizationId: string; userId: string; department: string }>("member_attributes")).updateOne(
    { organizationId, userId },
    { $set: { organizationId, userId, department } },
    { upsert: true },
  );
}
