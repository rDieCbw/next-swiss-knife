"use client";
import type { Machine } from "@swiss/contracts";
import { useEffect, useState } from "react";
import { useAlarms } from "@/alarms";

export function Board({ initial }: { initial: Machine[] }) {
  const [machine, setMachine] = useState<Machine>(initial[0] ?? { id: "press-1", name: "Prensa 1", state: "idle", temperature: 0 });
  const dismissed = useAlarms((state) => state.dismissed);
  const dismiss = useAlarms((state) => state.dismiss);
  useEffect(() => {
    const source = new EventSource(`${process.env.NEXT_PUBLIC_REALTIME_URL ?? "http://localhost:3009"}/sse/telemetry?machineId=press-1`);
    source.onmessage = (event) => setMachine(JSON.parse(event.data) as Machine);
    return () => source.close();
  }, []);
  const alarm = machine.state === "alarm" && !dismissed.includes(machine.id);
  return (
    <section>
      <h1>{machine.name}</h1>
      <p>{machine.state} · {machine.temperature.toFixed(1)}°C</p>
      <p className="live" role="status" aria-live="assertive">{alarm ? "Alarme de temperatura" : ""}</p>
      {alarm ? <button type="button" onClick={() => dismiss(machine.id)}>Dispensar</button> : null}
    </section>
  );
}
