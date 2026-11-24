import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");
const nextConfig: NextConfig = {
  typedRoutes: true, output: "standalone",
  transpilePackages: ["@swiss/ui", "@swiss/contracts", "@swiss/auth-client", "@swiss/tf-recommend", "@swiss/observability"],
  serverExternalPackages: ["mongodb", "redis", "better-auth", "@tensorflow/tfjs", "pino", "@opentelemetry/sdk-node"],
  async rewrites() { const auth = process.env.AUTH_URL ?? "http://localhost:3001";
    const gateway = process.env.GATEWAY_URL ?? "http://localhost:3000";
    return [
      { source: "/api/auth/:path*", destination: `${auth}/api/auth/:path*` },
      { source: "/api/gateway/:path*", destination: `${gateway}/api/:path*` },
    ]; },
};
export default withNextIntl(nextConfig);
