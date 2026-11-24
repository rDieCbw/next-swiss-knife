import "@swiss/ui/styles.css";
import { AppShell, routing } from "@swiss/ui";
import { hasLocale } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { ErrorReporter } from "./error-reporter";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function Layout({ children, params }: { children: ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  return (
    <AppShell locale={locale} messages={await getMessages()}>
      <ErrorReporter />
      {children}
    </AppShell>
  );
}
