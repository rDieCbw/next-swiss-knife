import { z } from "zod";

export const locales = ["pt-BR", "en"] as const;
export const localeSchema = z.enum(locales);

export const productSchema = z.object({
  sku: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().min(1),
  priceCents: z.number().int().nonnegative(),
});
export const productListSchema = z.array(productSchema);

export const storySchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  body: z.string().min(1),
});

export const leadSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

export const cartLineSchema = z.object({
  sku: z.string().min(1),
  quantity: z.number().int().positive(),
});

export const orderSchema = z.object({
  id: z.string().min(1),
  organizationId: z.string().min(1),
  lines: z.array(cartLineSchema),
  totalCents: z.number().int().nonnegative(),
  createdAt: z.string(),
});

export const auditSchema = z.object({
  id: z.string().min(1),
  organizationId: z.string().min(1),
  action: z.string().min(1),
  subjectId: z.string().min(1),
  createdAt: z.string(),
});

export const machineSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  state: z.enum(["idle", "running", "alarm"]),
  temperature: z.number(),
});

export const mediaSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  status: z.enum(["queued", "processing", "ready", "failed"]),
  playbackPath: z.string().nullable(),
});

export const messageSchema = z.object({
  id: z.string().min(1),
  room: z.string().min(1),
  text: z.string().min(1),
  createdAt: z.string(),
});

export const storefrontSchema = z.object({
  products: productListSchema,
  stories: z.array(storySchema),
});

export const accessRoleSchema = z.enum(["owner", "admin", "member"]);

export type Product = z.infer<typeof productSchema>;
export type Story = z.infer<typeof storySchema>;
export type Lead = z.infer<typeof leadSchema>;
export type CartLine = z.infer<typeof cartLineSchema>;
export type Order = z.infer<typeof orderSchema>;
export type AuditEntry = z.infer<typeof auditSchema>;
export type Machine = z.infer<typeof machineSchema>;
export type MediaItem = z.infer<typeof mediaSchema>;
export type ChatMessage = z.infer<typeof messageSchema>;
export type AccessRole = z.infer<typeof accessRoleSchema>;
export type MachineState = Machine["state"];
