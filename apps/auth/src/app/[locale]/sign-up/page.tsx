"use client";

import { authClient } from "@swiss/auth-client/browser";
import { TextField } from "@swiss/ui";
import { useTranslations } from "next-intl";
import { useState } from "react";

export default function SignUpPage() {
  const t = useTranslations("auth");
  const [message, setMessage] = useState("");
  return (
    <form action={async (formData) => {
      const email = readText(formData, "email");
      const password = readText(formData, "password");
      const name = readText(formData, "name");
      if (!email || !password || !name) {
        setMessage(t("failed"));
        return;
      }
      const result = await authClient.signUp.email({ email, password, name });
      setMessage(result.error ? result.error.message ?? t("failed") : t("created"));
    }}>
      <h1>{t("signUp")}</h1>
      <TextField label={t("name")} name="name" />
      <TextField label={t("email")} name="email" type="email" />
      <TextField label={t("password")} name="password" type="password" />
      <button type="submit">{t("signUp")}</button>
      <p className="live" role="status">{message}</p>
    </form>
  );
}

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" && value.trim() ? value.trim() : null;
}
