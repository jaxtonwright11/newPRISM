import { NextResponse } from "next/server";
import { applyRateLimit, parseQuery, slugSchema } from "@/lib/api";
import { getSupabaseServer, getSupabaseWithAuth } from "@/lib/supabase";
import { SEED_PERSPECTIVES } from "@/lib/seed-data";
import { z } from "zod";

const feedQuerySchema = z
  .object({
    topic: slugSchema.optional(),
  })
  .strict();

export async function GET(request: Request) {
  const rateLimitResponse = applyRateLimit(request, "feed-discover");
  if (rateLimitResponse) return rateLimitResponse;

  const parsedQuery = parseQuery(request, feedQuerySchema);
  if (!parsedQuery.success) return parsedQuery.response;

  const topic = parsedQuery.data.topic;

  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    const supabase = token ? getSupabaseWithAuth(token) : getSupabaseServer();

    if (supabase) {
      // Get communities the user has ALREADY engaged with, so we can exclude them
      const engagedCommunityIds: string[] = [];

      if (token) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Home community
          const { data: userData } = await supabase
            .from("users")
            .select("home_community_id")
            .eq("id", user.id)
            .single();

          if (userData?.home_community_id) {
            engagedCommunityIds.push(userData.home_community_id);
          }

          // Communities reacted to
          const { data: reactions } = await supabase
            .from("reactions")
            .select("perspective:perspectives(community_id)")
            .eq("user_id", user.id);

          if (reactions) {
            for (const r of reactions) {
              const persp = r.perspective as unknown as { community_id: string } | null;
              if (persp?.community_id && !engagedCommunityIds.includes(persp.community_id)) {
                engagedCommunityIds.push(persp.community_id);
              }
            }
          }

          // Communities bookmarked from
          const { data: bookmarks } = await supabase
            .from("bookmarks")
            .select("perspective:perspectives(community_id)")
            .eq("user_id", user.id)
            .eq("bookmark_type", "perspective");

          if (bookmarks) {
            for (const b of bookmarks) {
              const persp = b.perspective as unknown as { community_id: string } | null;
              if (persp?.community_id && !engagedCommunityIds.includes(persp.community_id)) {
                engagedCommunityIds.push(persp.community_id);
              }
            }
          }
        }
      }

      // Perspectives from communities user has NEVER engaged with
      // Prioritize viewpoint diversity — NOT engagement metrics
      let query = supabase
        .from("perspectives")
        .select("*, community:communities!inner(id, name, region, community_type, color_hex, verified)")
        .eq("verified", true)
        .order("created_at", { ascending: false })
        .limit(30);

      // Exclude engaged communities if user is authenticated
      if (engagedCommunityIds.length > 0) {
        query = query.not("community_id", "in", `(${engagedCommunityIds.join(",")})`);
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
          meta: { total: data.length, feed_type: "discover" },
        });
      }
    }
  } catch {
    // fall through to seed data
  }

  let perspectives = SEED_PERSPECTIVES;
  if (topic) {
    perspectives = perspectives.filter((p) => p.topic_slug === topic);
  }

  const discoverPerspectives = perspectives.filter(
    (p) =>
      p.community.community_type !== "civic" &&
      p.community.community_type !== "rural"
  );

  return NextResponse.json({
    data: discoverPerspectives,
    meta: { total: discoverPerspectives.length, feed_type: "discover" },
  });
}
