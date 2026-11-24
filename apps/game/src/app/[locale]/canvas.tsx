"use client";
import { useEffect, useRef } from "react";
import { useGame } from "@/game-store";

export function GameCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const setPosition = useGame((state) => state.setPosition);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    let frame = 0;
    const draw = () => {
      if (!context) return;
      const { x, y } = useGame.getState();
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = "#1c1915";
      context.fillRect(x, y, 24, 24);
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    const socket = new WebSocket(process.env.NEXT_PUBLIC_REALTIME_WS ?? "ws://localhost:3009/ws");
    socketRef.current = socket;
    socket.onopen = () => socket.send(JSON.stringify({ type: "join", room: "arcade" }));
    socket.onmessage = (event) => {
      const message = JSON.parse(event.data) as { type: string; x?: number; y?: number };
      if (message.type === "state" && message.x !== undefined && message.y !== undefined) setPosition(message.x, message.y);
    };
    const onKey = (event: KeyboardEvent) => {
      const step = event.key === "ArrowRight" ? { dx: 8, dy: 0 } : event.key === "ArrowLeft" ? { dx: -8, dy: 0 } : event.key === "ArrowUp" ? { dx: 0, dy: -8 } : event.key === "ArrowDown" ? { dx: 0, dy: 8 } : null;
      if (!step) return;
      event.preventDefault();
      socket.send(JSON.stringify({ type: "input", room: "arcade", ...step }));
    };
    window.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(frame);
      socket.close();
      socketRef.current = null;
      window.removeEventListener("keydown", onKey);
    };
  }, [setPosition]);
  return (
    <section>
      <h1>Jogo</h1>
      <canvas ref={ref} width={320} height={180} aria-label="Área do jogo" />
      <button
        type="button"
        onClick={() => {
          const socket = socketRef.current;
          if (!socket || socket.readyState !== WebSocket.OPEN) return;
          socket.send(JSON.stringify({ type: "input", room: "arcade", dx: 8, dy: 0 }));
        }}
      >
        Mover para a direita
      </button>
    </section>
  );
}
