import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";
import { publish, publishEvent } from "@swiss/cache-redis";
import { saveMedia } from "@swiss/data-mongo";

export async function POST(request: Request) {
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return Response.json({ reason: "missing-file" }, { status: 400 });
  const id = randomUUID();
  const root = path.join(process.cwd(), "data", "media");
  await mkdir(root, { recursive: true });
  const source = path.join(root, `${id}-source`);
  const output = path.join(root, `${id}.mp4`);
  await writeFile(source, Buffer.from(await file.arrayBuffer()));
  await saveMedia({ id, title: file.name, status: "processing", playbackPath: null });
  await publish(`media:${id}`, { id, status: "processing" });
  await new Promise<void>((resolve) => {
    let settled = false;
    const finish = (status: "ready" | "failed", playbackPath: string | null) => {
      if (settled) return;
      settled = true;
      void saveMedia({ id, title: file.name, status, playbackPath });
      void publish(`media:${id}`, { id, status });
      void publishEvent("stream:media", status === "ready" ? "media.ready" : "media.failed", { id });
      resolve();
    };
    const child = spawn("ffmpeg", ["-y", "-i", source, "-c:v", "libx264", "-pix_fmt", "yuv420p", output]);
    child.on("close", (code) => {
      const ready = code === 0;
      finish(ready ? "ready" : "failed", ready ? `/api/playback/${id}` : null);
    });
    child.on("error", () => {
      finish("failed", null);
    });
  });
  return Response.json({ id });
}
