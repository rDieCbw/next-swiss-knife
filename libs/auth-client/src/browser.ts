"use client";

import { createAuthClient } from "better-auth/react";
import { magicLinkClient, organizationClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: typeof window === "undefined" ? process.env.NEXT_PUBLIC_AUTH_URL : window.location.origin,
  plugins: [organizationClient(), magicLinkClient()],
});
