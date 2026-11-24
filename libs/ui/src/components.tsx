"use client";

import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { localeLabels, routing } from "./i18n";

export function SkipLink() {
  const t = useTranslations("common");
  return (
    <a className="skip" href="#content">
      {t("skip")}
    </a>
  );
}

export function LocaleSwitcher() {
  const pathname = usePathname() ?? "/";
  const t = useTranslations("common");
  const segments = pathname.split("/");
  const current = routing.locales.find((locale) => locale === segments[1]) ?? routing.defaultLocale;

  return (
    <label>
      {t("language")}
      <select
        value={current}
        onChange={(event) => {
          segments[1] = event.target.value;
          window.location.assign(segments.join("/") || "/");
        }}
      >
        {routing.locales.map((locale) => (
          <option key={locale} value={locale}>
            {localeLabels[locale]}
          </option>
        ))}
      </select>
    </label>
  );
}

export function TextField({
  label,
  name,
  type = "text",
}: {
  label: string;
  name: string;
  type?: string;
}) {
  return (
    <label>
      {label}
      <input name={name} type={type} required />
    </label>
  );
}

export function DialogButton({ title, children }: { title: string; children: ReactNode }) {
  return (
    <>
      <button
        type="button"
        onClick={(event) => {
          event.currentTarget.nextElementSibling?.setAttribute("open", "");
        }}
      >
        {title}
      </button>
      <dialog>
        {children}
        <form method="dialog">
          <button type="submit">OK</button>
        </form>
      </dialog>
    </>
  );
}
