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
  const url = new URL(request.url);
  const offset = Math.max(0, parseInt(url.searchParams.get("offset") ?? "0") || 0);
  const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get("limit") ?? "30") || 30));

  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    const supabase = token ? getSupabaseWithAuth(token) : getSupabase();

    if (supabase) {
      // Get user's followed community IDs
      const followedCommunityIds: string[] = [];

      if (token) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Fetch follows and home community in parallel
          const [{ data: follows }, { data: userData }] = await Promise.all([
            supabase
              .from("community_follows")
              .select("community_id")
              .eq("user_id", user.id),
            supabase
              .from("users")
              .select("home_community_id")
              .eq("id", user.id)
              .single(),
          ]);

          if (follows) {
            for (const f of follows) {
              followedCommunityIds.push(f.community_id);
            }
          }

          if (userData?.home_community_id && !followedCommunityIds.includes(userData.home_community_id)) {
            followedCommunityIds.push(userData.home_community_id);
          }
        }
      }

      // Build perspectives query filtered by followed communities
      let query = supabase
        .from("perspectives")
        .select("*, community:communities(id, name, region, community_type, color_hex, verified)")
        .eq("verified", true)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

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
        const lastItem = data[data.length - 1] as Record<string, unknown> | undefined;
        return NextResponse.json({
          data,
          meta: {
            total: data.length,
            feed_type: "communities",
            next_cursor: data.length === limit ? (lastItem?.created_at as string | undefined) : null,
            has_more: data.length === limit,
          },
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
