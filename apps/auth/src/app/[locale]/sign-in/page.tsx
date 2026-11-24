"use client";

import { authClient } from "@swiss/auth-client/browser";
import { TextField } from "@swiss/ui";
import { useTranslations } from "next-intl";
import { useState } from "react";

export default function SignInPage() {
  const t = useTranslations("auth");
  const [message, setMessage] = useState("");
  return (
    <form action={async (formData) => {
      const email = readText(formData, "email");
      const password = readText(formData, "password");
      if (!email || !password) {
        setMessage(t("failed"));
        return;
      }
      const result = await authClient.signIn.email({ email, password });
      setMessage(result.error ? result.error.message ?? t("failed") : t("signedIn"));
    }}>
      <h1>{t("signIn")}</h1>
      <TextField label={t("email")} name="email" type="email" />
      <TextField label={t("password")} name="password" type="password" />
      <button type="submit">{t("signIn")}</button>
      <p className="live" role="status">{message}</p>
    </form>
  );
}

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" && value.trim() ? value.trim() : null;
}
