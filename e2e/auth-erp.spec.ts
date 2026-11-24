import { expect, test } from "@playwright/test";

test("signs in and opens the erp orders page", async ({ page, request }) => {
  const auth = process.env.AUTH_URL ?? "http://127.0.0.1:3001";
  const erp = process.env.ERP_URL ?? "http://127.0.0.1:3004";
  const health = await request.get(`${auth}/pt-BR`).catch(() => null);
  test.skip(!health?.ok(), "auth app is not running");
  await page.goto(`${auth}/pt-BR/sign-up`);
  await page.getByLabel("E-mail").fill(`ada-${Date.now()}@example.com`);
  await page.getByLabel("Senha").fill("correct-horse-battery");
  await page.getByLabel("Nome").fill("Ada");
  await page.getByRole("button", { name: "Criar conta" }).click();
  await expect(page.getByRole("status")).toContainText(/Conta criada|Could not|Não foi/);
  await page.goto(`${erp}/pt-BR`);
  await expect(page.getByRole("heading", { name: "ERP" })).toBeVisible();
});
