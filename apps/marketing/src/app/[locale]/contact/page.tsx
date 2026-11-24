import { TextField } from "@swiss/ui";
import { getTranslations } from "next-intl/server";
import { submitLead } from "./actions";

export default async function ContactPage() {
  const t = await getTranslations("marketing");
  return (
    <form action={submitLead}>
      <h1>{t("contact")}</h1>
      <TextField label={t("name")} name="name" />
      <TextField label={t("email")} name="email" type="email" />
      <button type="submit">{t("send")}</button>
    </form>
  );
}
