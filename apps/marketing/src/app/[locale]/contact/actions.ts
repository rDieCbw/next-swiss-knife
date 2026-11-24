"use server";

import { createLead } from "@swiss/contracts/api";

export async function submitLead(formData: FormData) {
  const name = readText(formData, "name");
  const email = readText(formData, "email");
  if (!name || !email) {
    throw new Error("missing-fields");
  }
  await createLead({ name, email });
}

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" && value.trim() ? value.trim() : null;
}
