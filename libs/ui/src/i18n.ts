import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["pt-BR", "en"],
  defaultLocale: "pt-BR",
  localePrefix: "always",
});

export const localeLabels = {
  "pt-BR": "Português",
  en: "English",
} as const;
