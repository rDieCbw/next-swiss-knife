import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_MARKETING_URL ?? "http://localhost:3002";
  return ["pt-BR", "en"].flatMap((locale) => [
    { url: `${base}/${locale}`, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/${locale}/stories/prensa-hidraulica`, changeFrequency: "daily", priority: 0.7 },
  ]);
}
