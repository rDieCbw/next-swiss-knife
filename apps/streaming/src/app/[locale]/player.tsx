"use client";
import { useState } from "react";

export function Player() {
  const [status, setStatus] = useState("idle");
  const [src, setSrc] = useState("");
  return (
    <section>
      <form action={async (formData) => {
        const response = await fetch("/api/upload", { method: "POST", body: formData });
        const body = await response.json();
        if (!response.ok) { setStatus("failed"); return; }
        const source = new EventSource(`${process.env.NEXT_PUBLIC_REALTIME_URL ?? "http://localhost:3009"}/sse/media?id=${body.id}`);
        source.onmessage = (event) => {
          const payload = JSON.parse(event.data) as { status: string; id: string };
          setStatus(payload.status);
          if (payload.status === "ready") {
            setSrc(`/api/playback/${payload.id}`);
            source.close();
          }
          if (payload.status === "failed") source.close();
        };
      }}>
        <label>Arquivo<input name="file" type="file" required /></label>
        <button type="submit">Enviar</button>
      </form>
      <p role="status">{status}</p>
      {src ? <video controls src={src} /> : null}
    </section>
  );
}
