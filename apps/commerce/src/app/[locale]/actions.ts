"use server";

import { createOrder } from "@swiss/contracts/api";
import { cookies } from "next/headers";
import type { CartLine } from "@swiss/contracts";

export async function checkout(tenantId: string, lines: CartLine[]) {
  const cookie = (await cookies()).toString();
  return createOrder(tenantId, lines, cookie);
}
