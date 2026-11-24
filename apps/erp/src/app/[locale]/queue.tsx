"use client";
import { useState } from "react";
import { useOfflineQueue } from "@/offline";
import { flushNotes } from "./actions";

export function OfflineQueue({ tenantId }: { tenantId: string }) {
  const items = useOfflineQueue((state) => state.items);
  const enqueue = useOfflineQueue((state) => state.enqueue);
  const clear = useOfflineQueue((state) => state.clear);
  const [status, setStatus] = useState(typeof navigator === "undefined" || navigator.onLine ? "online" : "offline");
  return (
    <section>
      <p role="status">{status}</p>
      <form action={async (formData) => { enqueue(String(formData.get("note") ?? "")); }}>
        <label>Nota<input name="note" required /></label>
        <button type="submit">Guardar offline</button>
      </form>
      <ul>{items.map((item) => <li key={item.id}>{item.note}</li>)}</ul>
      <button type="button" onClick={async () => {
        if (!navigator.onLine) { setStatus("offline"); return; }
        await flushNotes(tenantId, items.map((item) => item.note));
        clear();
        setStatus("synced");
      }}>Sincronizar</button>
    </section>
  );
}
