import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase";
import { TopicComparison } from "./topic-comparison";

interface Props {
  params: Promise<{ slug: string }>;
}

async function getTopicWithPerspectives(slug: string) {
  const supabase = getSupabaseServer();
  if (!supabase) return null;

  const { data: topic } = await supabase
    .from("topics")
    .select("id, title, slug, summary, status")
    .eq("slug", slug)
    .single();

  if (!topic) return null;

  const { data: perspectives } = await supabase
    .from("perspectives")
    .select("id, quote, community:communities(name, region, community_type, color_hex)")
    .eq("topic_id", topic.id)
    .eq("verified", true)
    .order("created_at", { ascending: false })
    .limit(6);

  return {
    topic,
    perspectives: (perspectives ?? []).map((p) => {
      const comm = Array.isArray(p.community) ? p.community[0] : p.community;
      return {
        id: p.id as string,
        quote: p.quote as string,
        community: {
          name: (comm as { name: string })?.name ?? "Community",
          region: (comm as { region: string })?.region ?? "",
          community_type: (comm as { community_type: string })?.community_type ?? "civic",
          color_hex: (comm as { color_hex: string })?.color_hex ?? "#3B82F6",
        },
      };
    }),
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await getTopicWithPerspectives(slug);
  if (!data) return { title: "PRISM" };

  const { topic, perspectives } = data;
  const communityNames = perspectives.slice(0, 3).map((p) => p.community.name).join(", ");
  const description = perspectives.length >= 2
    ? `See how ${communityNames} experience "${topic.title}" — same topic, completely different worlds.`
    : topic.summary ?? `Perspectives on ${topic.title}`;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://web-liard-psi-12.vercel.app";

  return {
    title: `${topic.title} — PRISM`,
    description,
    openGraph: {
      title: `${topic.title} — PRISM`,
      description,
      url: `${siteUrl}/compare/${slug}`,
      images: [{ url: `${siteUrl}/api/og/compare/topic?slug=${slug}`, width: 1200, height: 630 }],
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: `${topic.title} — PRISM`,
      description,
      images: [`${siteUrl}/api/og/compare/topic?slug=${slug}`],
    },
  };
}

export default async function TopicComparePage({ params }: Props) {
  const { slug } = await params;
  const data = await getTopicWithPerspectives(slug);

  if (!data) {
    notFound();
  }

  const hasComparison = data.perspectives.length >= 2;

  return (
    <div className="min-h-screen bg-prism-bg-base">
      <header className="flex items-center justify-between px-4 py-3 border-b border-prism-border">
        <Link href="/" className="text-lg font-display font-bold text-prism-text-primary tracking-tight">
          PRISM
        </Link>
        <Link
          href="/signup"
          className="px-4 py-2 rounded-lg bg-prism-accent-primary text-white text-sm font-medium hover:bg-prism-accent-glow transition-colors"
        >
          Join PRISM
        </Link>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {hasComparison ? (
          <TopicComparison
            topicTitle={data.topic.title}
            topicSummary={data.topic.summary}
            perspectives={data.perspectives}
            slug={slug}
          />
        ) : (
          <div className="text-center py-12">
            <div className="w-14 h-14 rounded-full bg-prism-accent-primary/10 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-prism-accent-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
              </svg>
            </div>
            <h1 className="font-display font-bold text-xl text-prism-text-primary mb-2">
              {data.topic.title}
            </h1>
            {data.topic.summary && (
              <p className="text-sm text-prism-text-secondary mb-4 max-w-md mx-auto">{data.topic.summary}</p>
            )}
            {data.perspectives.length === 1 && (
              <div className="max-w-md mx-auto mb-6 p-4 rounded-xl bg-prism-bg-surface border border-prism-border text-left"
                style={{ borderLeftWidth: "3px", borderLeftColor: data.perspectives[0].community.color_hex }}>
                <p className="text-xs font-semibold text-prism-text-dim mb-1">{data.perspectives[0].community.name}</p>
                <p className="text-sm text-prism-text-primary leading-relaxed">&ldquo;{data.perspectives[0].quote}&rdquo;</p>
              </div>
            )}
            <p className="text-sm text-prism-text-dim mb-4">
              {data.perspectives.length === 0
                ? "No communities have shared their perspective on this topic yet."
                : "One community has shared so far. The comparison view opens when a second community weighs in."}
            </p>
          </div>
        )}

        <div className="mt-8 text-center space-y-3">
          <p className="text-sm text-prism-text-secondary">
            {hasComparison
              ? `${data.perspectives.length} communities sharing perspectives on this topic`
              : "Be the voice that starts the conversation"}
          </p>
          <Link
            href="/signup"
            className="inline-block px-6 py-2.5 rounded-xl bg-prism-accent-primary text-white text-sm font-medium hover:bg-prism-accent-glow transition-colors"
          >
            Add your community&apos;s perspective
          </Link>
        </div>
      </div>
    </div>
  );
}
