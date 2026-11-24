import { defineConfig, devices } from "@playwright/test";

const marketing = process.env.MARKETING_URL ?? "http://127.0.0.1:3002";

export default defineConfig({
  testDir: ".",
  timeout: 60_000,
  use: { baseURL: marketing, trace: "on-first-retry" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } } },
    { name: "mobile", use: { ...devices["Pixel 7"], viewport: { width: 390, height: 844 } } },
  ],
  webServer: process.env.PLAYWRIGHT_SKIP_WEBSERVER
    ? undefined
    : { command: "pnpm --filter @swiss/marketing dev", url: marketing, reuseExistingServer: true, cwd: ".." },
});
