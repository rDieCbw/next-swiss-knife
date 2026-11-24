import { getTranslations } from "next-intl/server";

export default async function AuthHome({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations("auth");
  return (
    <>
      <h1>{t("title")}</h1>
      <p><a href={`/${locale}/sign-in`}>{t("signIn")}</a></p>
      <p><a href={`/${locale}/sign-up`}>{t("signUp")}</a></p>
      <p><a href={`/${locale}/organization`}>{t("organization")}</a></p>
    </>
  );
}
