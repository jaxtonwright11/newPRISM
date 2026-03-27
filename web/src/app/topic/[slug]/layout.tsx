import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://web-liard-psi-12.vercel.app";
    const res = await fetch(`${baseUrl}/api/topics/${slug}`, {
      next: { revalidate: 60 },
    });

    if (res.ok) {
      const data = await res.json();
      const topic = data.topic;
      if (topic) {
        return {
          title: `${topic.title} — PRISM`,
          description: topic.summary || `See how ${topic.community_count} communities are experiencing ${topic.title} on PRISM.`,
          openGraph: {
            title: `${topic.title} — PRISM`,
            description: topic.summary || `${topic.perspective_count} perspectives from ${topic.community_count} communities.`,
            type: "article",
            siteName: "PRISM",
          },
          twitter: {
            card: "summary",
            title: `${topic.title} — PRISM`,
            description: topic.summary || `${topic.perspective_count} perspectives from ${topic.community_count} communities.`,
          },
        };
      }
    }
  } catch {
    // Fall through
  }

  return {
    title: "Topic — PRISM",
    description: "See how communities experience the world differently.",
  };
}

export default function TopicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
