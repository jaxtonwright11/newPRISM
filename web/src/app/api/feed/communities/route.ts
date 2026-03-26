import { NextResponse } from "next/server";
import { applyRateLimit, parseQuery, slugSchema } from "@/lib/api";
import { getSupabase, getSupabaseWithAuth } from "@/lib/supabase";

import { z } from "zod";

const feedQuerySchema = z
  .object({
    topic: slugSchema.optional(),
  })
  .strict();

export async function GET(request: Request) {
  const rateLimitResponse = applyRateLimit(request, "feed-communities");
  if (rateLimitResponse) return rateLimitResponse;

  const parsedQuery = parseQuery(request, feedQuerySchema);
  if (!parsedQuery.success) return parsedQuery.response;

  const topic = parsedQuery.data.topic;

  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    const supabase = token ? getSupabaseWithAuth(token) : getSupabase();

    if (supabase) {
      // Get user's followed/home community IDs
      const followedCommunityIds: string[] = [];

      if (token) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: userData } = await supabase
            .from("users")
            .select("home_community_id")
            .eq("id", user.id)
            .single();

          if (userData?.home_community_id) {
            followedCommunityIds.push(userData.home_community_id);
          }

          // Also get communities the user has engaged with (reacted to perspectives from)
          const { data: reactions } = await supabase
            .from("reactions")
            .select("perspective:perspectives(community_id)")
            .eq("user_id", user.id);

          if (reactions) {
            for (const r of reactions) {
              const persp = r.perspective as unknown as { community_id: string } | null;
              if (persp?.community_id && !followedCommunityIds.includes(persp.community_id)) {
                followedCommunityIds.push(persp.community_id);
              }
            }
          }
        }
      }

      // Build perspectives query filtered by followed communities
      let query = supabase
        .from("perspectives")
        .select("*, community:communities(id, name, region, community_type, color_hex, verified)")
        .eq("verified", true)
        .order("created_at", { ascending: false })
        .limit(30);

      if (followedCommunityIds.length > 0) {
        query = query.in("community_id", followedCommunityIds);
      }

      if (topic) {
        const { data: topicRow } = await supabase
          .from("topics")
          .select("id")
          .eq("slug", topic)
          .single();

        if (topicRow) {
          query = query.eq("topic_id", topicRow.id);
        }
      }

      const { data, error } = await query;

      if (!error && data) {
        return NextResponse.json({
          data,
          meta: { total: data.length, feed_type: "communities" },
        });
      }
    }
  } catch {
    // Supabase unavailable
  }

  return NextResponse.json({
    data: [],
    meta: { total: 0, feed_type: "communities" },
  });
}
