import { NextRequest, NextResponse } from "next/server";
import { applyRateLimit } from "@/lib/api";
import { getSupabaseServer } from "@/lib/supabase";
import type { InsightData } from "@shared/insights";

export async function GET(request: NextRequest) {
  const rateLimited = applyRateLimit(request, "insights");
  if (rateLimited) return rateLimited;

  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ insights: null });
  }

  try {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();

    // Fetch data in parallel
    const [alignmentsRes, perspectivesRes, topicsRes, reactionsRes] = await Promise.all([
      supabase.from("community_alignments").select("*").limit(200),
      supabase.from("perspectives").select("id, topic_id, community_id, created_at, community:communities(community_type, region)").limit(1000),
      supabase.from("topics").select("id, title, slug, status").neq("status", "archived").limit(50),
      supabase.from("reactions").select("perspective_id, reaction_type").limit(2000),
    ]);

    const alignments = alignmentsRes.data ?? [];
    const perspectives = perspectivesRes.data ?? [];
    const topics = topicsRes.data ?? [];
    const reactions = reactionsRes.data ?? [];

    const topicMap = new Map(topics.map((t) => [t.id, t]));

    // 1. Community Agreement Matrix — top 3 topics by alignment count
    const alignmentsByTopic: Record<string, typeof alignments> = {};
    for (const a of alignments) {
      if (!alignmentsByTopic[a.topic_id]) alignmentsByTopic[a.topic_id] = [];
      alignmentsByTopic[a.topic_id].push(a);
    }

    const agreementMatrix = Object.entries(alignmentsByTopic)
      .filter(([tid]) => topicMap.has(tid))
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 3)
      .map(([tid, als]) => ({
        topic: topicMap.get(tid)!.title,
        topic_id: tid,
        pairs: als.slice(0, 5).map((a) => ({
          types: (a.community_ids ?? []).slice(0, 2) as [string, string],
          agreement_pct: a.agreement_pct ?? 0,
        })),
      }));

    // 2. Perspective Diversity Score — topics with most diverse community types
    const topicTypes: Record<string, Set<string>> = {};
    const topicPerspectiveCounts: Record<string, number> = {};
    for (const p of perspectives) {
      const comm = p.community as unknown as { community_type?: string; region?: string } | null;
      if (!comm?.community_type) continue;
      if (!topicTypes[p.topic_id]) topicTypes[p.topic_id] = new Set();
      topicTypes[p.topic_id].add(comm.community_type);
      topicPerspectiveCounts[p.topic_id] = (topicPerspectiveCounts[p.topic_id] || 0) + 1;
    }

    const diversityScores = Object.entries(topicTypes)
      .filter(([tid]) => topicMap.has(tid))
      .map(([tid, types]) => {
        const t = topicMap.get(tid)!;
        const pCount = topicPerspectiveCounts[tid] || 0;
        return {
          topic: t.title,
          topic_id: tid,
          slug: t.slug,
          community_type_count: types.size,
          perspective_count: pCount,
          diversity_score: pCount > 0 ? Math.round((types.size / Math.min(pCount, 6)) * 100) : 0,
        };
      })
      .sort((a, b) => b.diversity_score - a.diversity_score)
      .slice(0, 5);

    // 3. Geographic Fault Lines — coastal vs rural divergence
    const topicReactionsByGeo: Record<string, { coastal: Record<string, number>; rural: Record<string, number> }> = {};
    const perspectiveTopicMap = new Map(perspectives.map((p) => [p.id, { topic_id: p.topic_id, community: p.community as unknown as { community_type?: string } | null }]));

    for (const r of reactions) {
      const p = perspectiveTopicMap.get(r.perspective_id);
      if (!p?.community?.community_type) continue;
      const geo = ["civic", "diaspora", "cultural", "academic"].includes(p.community.community_type) ? "coastal" : "rural";
      if (!topicReactionsByGeo[p.topic_id]) {
        topicReactionsByGeo[p.topic_id] = { coastal: {}, rural: {} };
      }
      topicReactionsByGeo[p.topic_id][geo][r.reaction_type] = (topicReactionsByGeo[p.topic_id][geo][r.reaction_type] || 0) + 1;
    }

    function dominantReaction(counts: Record<string, number>): string {
      const entries = Object.entries(counts);
      if (entries.length === 0) return "none";
      return entries.sort((a, b) => b[1] - a[1])[0][0];
    }

    const geographicFaults = Object.entries(topicReactionsByGeo)
      .filter(([tid]) => topicMap.has(tid))
      .map(([tid, geo]) => {
        const coastalDom = dominantReaction(geo.coastal);
        const ruralDom = dominantReaction(geo.rural);
        return {
          topic: topicMap.get(tid)!.title,
          topic_id: tid,
          coastal_sentiment: coastalDom,
          rural_sentiment: ruralDom,
          divergence: coastalDom !== ruralDom ? 1 : 0,
        };
      })
      .filter((f) => f.divergence > 0)
      .slice(0, 5);

    // 4. Rising Topics — fastest growing perspective volume
    const thisWeekCounts: Record<string, number> = {};
    const lastWeekCounts: Record<string, number> = {};
    for (const p of perspectives) {
      if (p.created_at >= oneWeekAgo) {
        thisWeekCounts[p.topic_id] = (thisWeekCounts[p.topic_id] || 0) + 1;
      } else if (p.created_at >= twoWeeksAgo) {
        lastWeekCounts[p.topic_id] = (lastWeekCounts[p.topic_id] || 0) + 1;
      }
    }

    const risingTopics = Object.entries(thisWeekCounts)
      .filter(([tid]) => topicMap.has(tid))
      .map(([tid, count]) => {
        const lastWeek = lastWeekCounts[tid] || 0;
        const t = topicMap.get(tid)!;
        return {
          topic: t.title,
          topic_id: tid,
          slug: t.slug,
          this_week: count,
          last_week: lastWeek,
          growth_pct: lastWeek > 0 ? Math.round(((count - lastWeek) / lastWeek) * 100) : count > 0 ? 100 : 0,
        };
      })
      .sort((a, b) => b.growth_pct - a.growth_pct)
      .slice(0, 5);

    const insights: InsightData = {
      agreementMatrix,
      diversityScores,
      geographicFaults,
      risingTopics,
    };

    const res = NextResponse.json({ insights });
    res.headers.set("Cache-Control", "public, s-maxage=120, stale-while-revalidate=600");
    return res;
  } catch (err) {
    return NextResponse.json({ error: "Failed to generate insights", details: String(err) }, { status: 500 });
  }
}
