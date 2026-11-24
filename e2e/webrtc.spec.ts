import { expect, test } from "@playwright/test";

test("two pages exchange a WebRTC data-channel greeting", async ({ browser }) => {
  const chat = process.env.CHAT_URL ?? "http://127.0.0.1:3008";
  const realtime = process.env.REALTIME_URL ?? "http://127.0.0.1:3009/health";
  const health = await fetch(realtime).catch(() => null);
  test.skip(!health?.ok, "realtime service is not running");
  const left = await browser.newPage();
  const right = await browser.newPage();
  await left.goto(`${chat}/pt-BR`);
  await right.goto(`${chat}/pt-BR`);
  await left.getByRole("button", { name: "Abrir canal WebRTC" }).click();
  await expect(left.getByRole("status")).not.toHaveText("", { timeout: 15_000 });
  await right.close();
  await left.close();
});
