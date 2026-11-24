"use client";

import { authClient } from "@swiss/auth-client/browser";
import { TextField } from "@swiss/ui";
import { useTranslations } from "next-intl";
import { useState } from "react";

export default function OrganizationPage() {
  const t = useTranslations("auth");
  const [message, setMessage] = useState("");
  return (
    <form action={async (formData) => {
      const name = readText(formData, "name");
      const slug = readText(formData, "slug");
      if (!name || !slug) {
        setMessage(t("failed"));
        return;
      }
      const created = await authClient.organization.create({ name, slug });
      if (created.error || !created.data) {
        setMessage(created.error?.message ?? t("failed"));
        return;
      }
      await authClient.organization.setActive({ organizationId: created.data.id });
      setMessage(t("active"));
    }}>
      <h1>{t("organization")}</h1>
      <TextField label={t("orgName")} name="name" />
      <TextField label={t("slug")} name="slug" />
      <button type="submit">{t("createOrg")}</button>
      <p className="live" role="status">{message}</p>
    </form>
  );
}

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" && value.trim() ? value.trim() : null;
}
