import { listMedia } from "@swiss/contracts/api";
import { Player } from "./player";

export const revalidate = 60;

export default async function StreamingHome() {
  let media: Awaited<ReturnType<typeof listMedia>> = [];
  try { media = await listMedia(); } catch { media = []; }
  return (
    <>
      <h1>Streaming</h1>
      <ul>{media.map((item) => <li key={item.id}>{item.title} · {item.status}</li>)}</ul>
      <Player />
    </>
  );
}
