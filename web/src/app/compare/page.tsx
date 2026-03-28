"use client";

// Note: OG metadata for /compare?ids=... is handled by the compare page's
// parent layout and the /api/og/compare route. Since this is a client component,
// generateMetadata can't be used here, but the OG image URL follows the pattern:
// /api/og/compare?ids=id1,id2,id3

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { PerspectiveComparison } from "@/components/perspective-comparison";
import { PrismWordmark } from "@/components/prism-wordmark";
import type { CommunityType } from "@shared/types";

interface ComparisonData {
  id: string;
  quote: string;
  topic?: { title: string };
  community: {
    name: string;
    region: string;
    community_type: CommunityType;
    color_hex: string;
  };
}

function ComparePageInner() {
  const searchParams = useSearchParams();
  const ids = searchParams.get("ids")?.split(",").filter(Boolean) ?? [];
  const [perspectives, setPerspectives] = useState<ComparisonData[]>([]);
  const [topicTitle, setTopicTitle] = useState("Perspective Comparison");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (ids.length === 0) {
      setLoading(false);
      return;
    }

    Promise.all(
      ids.map((id) =>
        fetch(`/api/perspectives/${id}`)
          .then((r) => r.json())
          .then((data) => data.perspective ?? data)
          .catch(() => null)
      )
    ).then((results) => {
      const valid = results.filter(Boolean) as ComparisonData[];
      setPerspectives(valid);
      if (valid[0]?.topic?.title) {
        setTopicTitle(valid[0].topic.title);
      }
      setLoading(false);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.get("ids")]);

  if (loading) {
    return (
      <div className="min-h-screen bg-prism-bg-base flex items-center justify-center">
        <div className="w-32 h-1 bg-prism-bg-elevated rounded-full overflow-hidden">
          <div className="h-full bg-prism-accent-primary/30 rounded-full animate-shimmer" style={{ width: "60%" }} />
        </div>
      </div>
    );
  }

  if (perspectives.length < 2) {
    return (
      <div className="min-h-screen bg-prism-bg-base flex flex-col items-center justify-center px-4 text-center">
        <PrismWordmark size="md" />
        <p className="text-prism-text-secondary mt-4">This comparison link is no longer available.</p>
        <Link href="/" className="mt-4 text-sm text-prism-accent-primary hover:underline">
          Explore PRISM →
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-prism-bg-base">
      <header className="flex items-center justify-between px-4 py-3 border-b border-prism-border">
        <Link href="/">
          <PrismWordmark size="sm" />
        </Link>
        <Link href="/signup" className="px-4 py-2 rounded-lg bg-prism-accent-primary text-white text-sm font-medium">
          Join PRISM
        </Link>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <PerspectiveComparison
          topicTitle={topicTitle}
          perspectives={perspectives}
          onSelectPerspective={(id) => { window.location.href = `/perspective/${id}`; }}
        />
      </div>
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense>
      <ComparePageInner />
    </Suspense>
  );
}
