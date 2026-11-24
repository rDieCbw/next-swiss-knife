import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import { LocaleSwitcher, SkipLink } from "./components";
import { QueryProvider } from "./providers";

export function AppShell({
  locale,
  messages,
  children,
}: {
  locale: string;
  messages: Record<string, unknown>;
  children: ReactNode;
}) {
  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <QueryProvider>
            <SkipLink />
            <div className="shell">
              <header>
                <strong>Swiss</strong>
                <LocaleSwitcher />
              </header>
              <main id="content">{children}</main>
            </div>
          </QueryProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
