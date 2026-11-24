import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import { WebSocketServer, type WebSocket } from "ws";
import { nextMachineState, type MachineState } from "@swiss/contracts";
import { publish, subscribe } from "@swiss/cache-redis";
import { saveMessage, updateMachine, getDb } from "@swiss/data-mongo";
import { getRedis } from "@swiss/cache-redis";
import { adjustGauge, createLogger, registerTelemetry } from "@swiss/observability";

const logger = createLogger("realtime");

const rooms = new Map<string, Set<WebSocket>>();
const positions = new Map<string, { x: number; y: number }>();

function join(room: string, socket: WebSocket) {
  const set = rooms.get(room) ?? new Set<WebSocket>();
  set.add(socket);
  rooms.set(room, set);
  adjustGauge("realtime_connections", 1, { kind: "websocket" });
  socket.on("close", () => {
    set.delete(socket);
    adjustGauge("realtime_connections", -1, { kind: "websocket" });
  });
}

async function fanout(room: string, message: unknown) {
  await publish(`room:${room}`, message);
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", "http://localhost");
  if (url.pathname === "/health" || url.pathname === "/api/healthz") {
    response.writeHead(200, { "content-type": "application/json" });
    response.end(JSON.stringify({ status: "ok", service: "realtime" }));
    return;
  }
  if (url.pathname === "/api/readyz") {
    const failures: string[] = [];
    const probe = (check: () => Promise<unknown>) =>
      Promise.race([check(), new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 500))]);
    try {
      await probe(async () => (await getDb()).command({ ping: 1 }));
    } catch {
      failures.push("mongo");
    }
    try {
      await probe(async () => (await getRedis()).ping());
    } catch {
      failures.push("redis");
    }
    response.writeHead(failures.length ? 503 : 200, { "content-type": "application/json" });
    response.end(JSON.stringify(failures.length ? { status: "unavailable", service: "realtime", failures } : { status: "ok", service: "realtime" }));
    return;
  }
  if (url.pathname === "/sse/telemetry" || url.pathname === "/sse/media") {
    const channel = url.pathname === "/sse/telemetry"
      ? `telemetry:${url.searchParams.get("machineId") ?? "press-1"}`
      : `media:${url.searchParams.get("id") ?? ""}`;
    response.writeHead(200, {
      "content-type": "text/event-stream",
      "cache-control": "no-cache",
      connection: "keep-alive",
      "access-control-allow-origin": "*",
    });
    adjustGauge("realtime_connections", 1, { kind: "sse" });
    const unsubscribe = await subscribe(channel, (message) => {
      response.write(`data: ${JSON.stringify(message)}\n\n`);
    });
    request.on("close", () => {
      unsubscribe();
      adjustGauge("realtime_connections", -1, { kind: "sse" });
    });
    return;
  }
  response.writeHead(404);
  response.end();
});

const wss = new WebSocketServer({ server, path: "/ws" });
wss.on("connection", (socket) => {
  socket.on("message", async (raw) => {
    const message = JSON.parse(String(raw)) as { type: string; room: string; text?: string; dx?: number; dy?: number; payload?: unknown };
    if (message.type === "join") {
      join(message.room, socket);
      await subscribe(`room:${message.room}`, (payload) => socket.send(JSON.stringify(payload)));
      return;
    }
    if (message.type === "chat" && message.text) {
      const stored = { id: randomUUID(), room: message.room, text: message.text, createdAt: new Date().toISOString() };
      await saveMessage(stored);
      await fanout(message.room, { type: "chat", ...stored });
      return;
    }
    if (message.type === "input") {
      const current = positions.get(message.room) ?? { x: 16, y: 16 };
      const next = { x: Math.max(0, Math.min(296, current.x + (message.dx ?? 0))), y: Math.max(0, Math.min(156, current.y + (message.dy ?? 0))) };
      positions.set(message.room, next);
      await fanout(message.room, { type: "state", ...next });
      return;
    }
    if (message.type === "signal") {
      await fanout(message.room, { type: "signal", payload: message.payload });
      return;
    }
  });
});

let temperature = 22;
let state: MachineState = "idle";
setInterval(() => {
  temperature = state === "alarm" ? temperature - 3 : temperature + 1.5;
  temperature = Math.max(20, Math.min(90, temperature));
  state = nextMachineState(state, temperature);
  const machine = { id: "press-1", name: "Prensa 1", state, temperature };
  void updateMachine(machine).catch(() => undefined);
  void publish("telemetry:press-1", machine).catch(() => undefined);
}, 1000);

const port = Number(process.env.PORT ?? 3009);
void registerTelemetry("realtime");
server.listen(port, () => {
  logger.info({ port }, "realtime listening");
});
