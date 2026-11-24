import { getTranslations } from "next-intl/server";

export default async function GatewayHome() {
  const t = await getTranslations("gateway");
  return (
    <>
      <h1>{t("title")}</h1>
      <p>{t("body")}</p>
      <p><a href="/pt-BR/docs">Swagger</a></p>
    </>
  );
}
