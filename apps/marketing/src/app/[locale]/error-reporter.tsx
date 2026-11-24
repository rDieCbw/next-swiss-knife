"use client";

import { installClientErrorReporting } from "@swiss/observability/browser";
import { useEffect } from "react";

export function ErrorReporter() {
  useEffect(() => {
    installClientErrorReporting();
  }, []);
  return null;
}
