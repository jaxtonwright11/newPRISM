import { NextResponse } from "next/server";
import { applyRateLimit } from "@/lib/api";
import { getSupabase, getSupabaseWithAuth } from "@/lib/supabase";

/**
 * Comparison-first feed: groups verified perspectives by topic,
 * returning topic groups with 2+ perspectives from different communities.
 * Single-perspective topics are included with a flag for "add your voice" CTA.
 */
export async function GET(request: Request) {
  const rateLimitResponse = applyRateLimit(request, "feed-comparisons");
  if (rateLimitResponse) return rateLimitResponse;

  const url = new URL(request.url);
  const offset = Math.max(0, parseInt(url.searchParams.get("offset") ?? "0") || 0);
  const limit = Math.min(20, Math.max(1, parseInt(url.searchParams.get("limit") ?? "10") || 10));

  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    const supabase = token ? getSupabaseWithAuth(token) : getSupabase();

    if (!supabase) {
      return NextResponse.json({ data: [], meta: { total: 0 } });
    }

    // Fetch topics that have verified perspectives, ordered by recency/activity
    const { data: topics } = await supabase
      .from("topics")
      .select("id, title, slug, status, perspective_count, community_count")
      .in("status", ["active", "trending", "hot"])
      .order("updated_at", { ascending: false })
      .range(offset, offset + limit + 5); // fetch extra to compensate for filtering

    if (!topics || topics.length === 0) {
      return NextResponse.json({ data: [], meta: { total: 0 } });
    }

    // For each topic, fetch perspectives grouped by community
    const topicIds = topics.map((t) => t.id);
    const { data: perspectives } = await supabase
      .from("perspectives")
      .select("id, quote, context, topic_id, reaction_count, bookmark_count, created_at, community:communities!inner(id, name, region, community_type, color_hex, verified)")
      .eq("verified", true)
      .in("topic_id", topicIds)
      .order("created_at", { ascending: false });

    if (!perspectives) {
      return NextResponse.json({ data: [], meta: { total: 0 } });
    }

    // Group by topic, ensuring community diversity
    const topicMap = new Map<string, typeof perspectives>();
    for (const p of perspectives) {
      const group = topicMap.get(p.topic_id as string) ?? [];
      group.push(p);
      topicMap.set(p.topic_id as string, group);
    }

    interface ComparisonGroup {
      topic: {
        id: string;
        title: string;
        slug: string;
        status: string;
      };
      perspectives: typeof perspectives;
      has_comparison: boolean;
    }

    const groups: ComparisonGroup[] = [];

    for (const topic of topics) {
      const topicPerspectives = topicMap.get(topic.id) ?? [];
      if (topicPerspectives.length === 0) continue;

      // Select diverse perspectives (different community types)
      const seen = new Set<string>();
      const diverse: typeof perspectives = [];
      for (const p of topicPerspectives) {
        const comm = Array.isArray(p.community) ? p.community[0] : p.community;
        const communityName = (comm as { name: string })?.name;
        if (communityName && !seen.has(communityName) && diverse.length < 4) {
          seen.add(communityName);
          diverse.push(p);
        }
      }

      groups.push({
        topic: {
          id: topic.id,
          title: topic.title,
          slug: topic.slug,
          status: topic.status,
        },
        perspectives: diverse,
        has_comparison: diverse.length >= 2,
      });
    }

    // Sort: multi-perspective comparisons first, then singles
    groups.sort((a, b) => {
      if (a.has_comparison && !b.has_comparison) return -1;
      if (!a.has_comparison && b.has_comparison) return 1;
      // Within same category, hot/trending first
      const statusOrder: Record<string, number> = { hot: 0, trending: 1, active: 2 };
      return (statusOrder[a.topic.status] ?? 3) - (statusOrder[b.topic.status] ?? 3);
    });

    const page = groups.slice(0, limit);

    return NextResponse.json({
      data: page,
      meta: {
        total: groups.length,
        has_more: groups.length > limit,
      },
    });
  } catch {
    // Supabase unavailable
  }

  return NextResponse.json({ data: [], meta: { total: 0 } });
}
