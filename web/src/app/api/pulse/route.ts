import { NextResponse } from "next/server";
import { applyRateLimit } from "@/lib/api";
import { getSupabaseServer, getSupabaseWithAuth } from "@/lib/supabase";

export async function GET(request: Request) {
  const rateLimitResponse = applyRateLimit(request, "pulse-daily");
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    const supabase = token ? getSupabaseWithAuth(token) : getSupabaseServer();

    if (supabase) {
      // 1. Top topic of the day — most perspectives added in last 24h
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      const { data: recentPerspectives } = await supabase
        .from("perspectives")
        .select("topic_id, topic:topics(id, title, slug, perspective_count, community_count)")
        .gte("created_at", oneDayAgo)
        .limit(500);

      let topTopic = null;
      if (recentPerspectives && recentPerspectives.length > 0) {
        // Count perspectives per topic
        const topicCounts = new Map<string, { count: number; topic: unknown }>();
        for (const p of recentPerspectives) {
          const tid = p.topic_id;
          if (!topicCounts.has(tid)) {
            topicCounts.set(tid, { count: 0, topic: p.topic });
          }
          topicCounts.get(tid)!.count++;
        }
        // Find the topic with the most recent perspectives
        let maxCount = 0;
        for (const [, val] of topicCounts) {
          if (val.count > maxCount) {
            maxCount = val.count;
            topTopic = val.topic;
          }
        }
      }

      // Fallback: get the topic with highest perspective_count overall
      if (!topTopic) {
        const { data: fallbackTopic } = await supabase
          .from("topics")
          .select("id, title, slug, perspective_count, community_count")
          .order("perspective_count", { ascending: false })
          .limit(1)
          .single();
        topTopic = fallbackTopic;
      }

      // 2. Most reacted perspective (last 24h or all-time fallback)
      const { data: mostReactedPersp } = await supabase
        .from("perspectives")
        .select("id, quote, reaction_count, community:communities(name, community_type)")
        .order("reaction_count", { ascending: false })
        .limit(1)
        .single();

      // 3. New communities that posted on topics the user cares about
      let newCommunities: unknown[] = [];

      if (token) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Get topics user has engaged with (reacted or bookmarked)
          const { data: userReactions } = await supabase
            .from("reactions")
            .select("perspective:perspectives(topic_id)")
            .eq("user_id", user.id);

          const engagedTopicIds = new Set<string>();
          if (userReactions) {
            for (const r of userReactions) {
              const p = r.perspective as unknown as { topic_id: string } | null;
              if (p?.topic_id) engagedTopicIds.add(p.topic_id);
            }
          }

          if (engagedTopicIds.size > 0) {
            // Find communities that recently posted perspectives on those topics
            const { data: recentComms } = await supabase
              .from("perspectives")
              .select("community:communities(id, name, region, community_type, color_hex, verified)")
              .in("topic_id", Array.from(engagedTopicIds))
              .gte("created_at", oneDayAgo)
              .limit(10);

            if (recentComms) {
              // Deduplicate communities
              const seen = new Set<string>();
              for (const r of recentComms) {
                const c = r.community as unknown as { id: string } | null;
                if (c && !seen.has(c.id)) {
                  seen.add(c.id);
                  newCommunities.push(c);
                }
              }
            }
          }
        }
      }

      // Fallback: show some communities if no user-specific results
      if (newCommunities.length === 0) {
        const { data: fallbackComms } = await supabase
          .from("communities")
          .select("id, name, region, community_type, color_hex, verified")
          .eq("active", true)
          .limit(3);
        newCommunities = fallbackComms ?? [];
      }

      return NextResponse.json({
        top_topic: topTopic,
        most_reacted: mostReactedPersp,
        new_communities: newCommunities.slice(0, 3),
      });
    }
  } catch {
    // fall through
  }

  return NextResponse.json({
    top_topic: null,
    most_reacted: null,
    new_communities: [],
  });
}
