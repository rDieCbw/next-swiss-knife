import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { routing } from "@swiss/ui";

export default getRequestConfig(async ({ locale, requestLocale }) => {
  const requested = locale ?? (await requestLocale);
  const resolved = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;
  const messages = (await import(`../../messages/${resolved}.json`)).default;
  return { locale: resolved, messages };
});
