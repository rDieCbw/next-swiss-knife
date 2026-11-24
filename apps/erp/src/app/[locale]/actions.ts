"use server";
import { saveAudit } from "@swiss/data-mongo";
export async function flushNotes(organizationId: string, notes: string[]) {
  for (const note of notes) {
    await saveAudit({ organizationId, action: "offline.note", subjectId: note });
  }
}
