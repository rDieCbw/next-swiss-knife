import { getStory } from "@swiss/contracts/api";
import { getTranslations } from "next-intl/server";

export const revalidate = 3600;

export function generateStaticParams() {
  return [{ slug: "prensa-hidraulica" }];
}

export default async function StoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const t = await getTranslations("marketing");
  try {
    const story = await getStory(slug);
    return (
      <article>
        <h1>{story.title}</h1>
        <p>{story.body}</p>
      </article>
    );
  } catch {
    return <p role="status">{t("unavailable")}</p>;
  }
}
