"use client";

import { useEffect, useRef, useState } from "react";

type Line = { id: string; text: string };
type Signal = { type?: string; candidate?: RTCIceCandidateInit; from?: string };
const wsUrl = process.env.NEXT_PUBLIC_REALTIME_WS ?? "ws://localhost:3009/ws";

export function Room() {
  const [lines, setLines] = useState<Line[]>([]);
  const [channel, setChannel] = useState("");
  const socketRef = useRef<WebSocket | null>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const self = useRef(crypto.randomUUID());

  function connection() {
    if (peerRef.current) return peerRef.current;
    const peer = new RTCPeerConnection();
    peerRef.current = peer;
    peer.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current?.send(JSON.stringify({ type: "signal", room: "lobby", payload: { candidate: event.candidate.toJSON(), from: self.current } }));
      }
    };
    peer.ondatachannel = (event) => {
      event.channel.onmessage = (message) => setChannel(String(message.data));
    };
    return peer;
  }

  useEffect(() => {
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;
    socket.onopen = () => socket.send(JSON.stringify({ type: "join", room: "lobby" }));
    socket.onmessage = async (event) => {
      const message = JSON.parse(event.data) as { type: string; id?: string; text?: string; payload?: Signal };
      if (message.type === "chat" && message.id && message.text) {
        setLines((current) => [...current, { id: message.id!, text: message.text! }]);
      }
      if (message.type !== "signal" || !message.payload || message.payload.from === self.current) return;
      const peer = connection();
      if (message.payload.type === "offer") {
        await peer.setRemoteDescription(message.payload as RTCSessionDescriptionInit);
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        socket.send(JSON.stringify({ type: "signal", room: "lobby", payload: { ...answer, from: self.current } }));
      } else if (message.payload.type === "answer") {
        await peer.setRemoteDescription(message.payload as RTCSessionDescriptionInit);
      } else if (message.payload.candidate) {
        await peer.addIceCandidate(message.payload.candidate);
      }
    };
    return () => socket.close();
  }, []);

  return (
    <section>
      <h1>Chat</h1>
      <div className="live" role="log" aria-live="polite">
        {lines.map((line) => (
          <p key={line.id}>{line.text}</p>
        ))}
      </div>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          socketRef.current?.send(JSON.stringify({ type: "chat", room: "lobby", text: String(form.get("text") ?? "") }));
          event.currentTarget.reset();
        }}
      >
        <label>
          Mensagem
          <input name="text" required />
        </label>
        <button type="submit">Enviar</button>
      </form>
      <button
        type="button"
        onClick={async () => {
          const peer = connection();
          const data = peer.createDataChannel("swiss");
          data.onopen = () => {
            data.send("olá do canal");
            setChannel("canal aberto");
          };
          data.onmessage = (event) => setChannel(String(event.data));
          const offer = await peer.createOffer();
          await peer.setLocalDescription(offer);
          socketRef.current?.send(JSON.stringify({ type: "signal", room: "lobby", payload: { ...offer, from: self.current } }));
        }}
      >
        Abrir canal WebRTC
      </button>
      <p role="status">{channel}</p>
    </section>
  );
}
