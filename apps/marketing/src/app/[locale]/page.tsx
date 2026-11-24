import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export const metadata: Metadata = {
  title: "Oficina Norte",
  description: "Catálogo industrial com páginas estáticas.",
};

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations("marketing");
  return (
    <>
      <h1>{t("title")}</h1>
      <p>{t("body")}</p>
      <p><a href={`/${locale}/stories/prensa-hidraulica`}>{t("story")}</a></p>
      <p><a href={`/${locale}/contact`}>{t("contact")}</a></p>
    </>
  );
}
