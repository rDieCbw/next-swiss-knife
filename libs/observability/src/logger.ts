import { Writable } from "node:stream";
import pino, { type DestinationStream, type Logger } from "pino";
import { getContext } from "./context";

const redactPaths = [
  "password",
  "token",
  "accessToken",
  "refreshToken",
  "authorization",
  "cookie",
  "secret",
  "*.password",
  "*.token",
  "*.accessToken",
  "*.refreshToken",
  "*.authorization",
  "*.cookie",
  "*.secret",
];

function splitByLevel(): DestinationStream {
  return new Writable({
    write(chunk, _encoding, callback) {
      const line = chunk.toString();
      try {
        const parsed = JSON.parse(line) as { level?: string };
        const errorLevel = parsed.level === "warn" || parsed.level === "error" || parsed.level === "fatal";
        (errorLevel ? process.stderr : process.stdout).write(line);
      } catch {
        process.stdout.write(line);
      }
      callback();
    },
  });
}

export function createLogger(service: string, destination?: DestinationStream): Logger {
  return pino(
    {
      level: process.env.LOG_LEVEL ?? "info",
      redact: { paths: redactPaths, censor: "[REDACTED]" },
      base: { service, env: process.env.NODE_ENV ?? "development" },
      timestamp: () => `,"timestamp":"${new Date().toISOString()}"`,
      formatters: {
        level(label) {
          return { level: label };
        },
      },
      mixin() {
        return Object.fromEntries(Object.entries(getContext()).filter(([, value]) => value));
      },
    },
    destination ?? splitByLevel(),
  );
}
