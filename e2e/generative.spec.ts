import { expect, test } from "@playwright/test";

const locales = ["pt-BR", "en"] as const;
const routes = ["", "/stories/prensa-hidraulica"] as const;

for (const locale of locales) {
  for (const route of routes) {
    test(`visits /${locale}${route} without console or document errors`, async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("console", (message) => {
        if (message.type() === "error") errors.push(message.text());
      });
      page.on("response", (response) => {
        const status = response.status();
        const documentError = status >= 400 && response.request().resourceType() === "document";
        if (documentError || status >= 500) errors.push(`${status} ${response.url()}`);
      });
      await page.goto(`/${locale}${route}`);
      await expect(page.locator("main")).toBeVisible();
      expect(errors).toEqual([]);
      if (locale === "pt-BR" && route === "") {
        await expect(page).toHaveScreenshot("marketing-home.png", { maxDiffPixelRatio: 0.05 });
      }
    });
  }
}
