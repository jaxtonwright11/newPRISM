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
  const rateLimitResponse = applyRateLimit(request, "feed-nearby");
  if (rateLimitResponse) return rateLimitResponse;

  const parsedQuery = parseQuery(request, feedQuerySchema);
  if (!parsedQuery.success) return parsedQuery.response;

  const topic = parsedQuery.data.topic;

  try {
    // Try authenticated client first for user-specific radius filtering
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    const supabase = token ? getSupabaseWithAuth(token) : getSupabase();

    if (supabase) {
      // Get user location and radius for proximity filter
      let userLat: number | null = null;
      let userLng: number | null = null;
      let userRadius = 40;

      if (token) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: userData } = await supabase
            .from("users")
            .select("default_radius_miles, home_community_id")
            .eq("id", user.id)
            .single();

          if (userData) {
            userRadius = userData.default_radius_miles ?? 40;
            if (userData.home_community_id) {
              const { data: comm } = await supabase
                .from("communities")
                .select("latitude, longitude")
                .eq("id", userData.home_community_id)
                .single();
              if (comm) {
                userLat = comm.latitude;
                userLng = comm.longitude;
              }
            }
          }
        }
      }

      // Build posts query — nearby posts ordered by recency
      let postsQuery = supabase
        .from("posts")
        .select("*, users!inner(ghost_mode, username, display_name, avatar_url)")
        .eq("users.ghost_mode", false)
        .order("created_at", { ascending: false })
        .limit(30);

      // Build perspectives query
      let perspQuery = supabase
        .from("perspectives")
        .select("*, community:communities(id, name, region, community_type, color_hex, verified)")
        .eq("verified", true)
        .order("created_at", { ascending: false })
        .limit(30);

      if (topic) {
        const { data: topicRow } = await supabase
          .from("topics")
          .select("id")
          .eq("slug", topic)
          .single();

        if (topicRow) {
          postsQuery = postsQuery.eq("topic_id", topicRow.id);
          perspQuery = perspQuery.eq("topic_id", topicRow.id);
        }
      }

      const [postsResult, perspResult] = await Promise.all([
        postsQuery,
        perspQuery,
      ]);

      let posts = postsResult.data ?? [];
      const perspectives = perspResult.data ?? [];

      // Apply haversine distance filter if user has a location
      if (userLat !== null && userLng !== null) {
        const radiusKm = userRadius * 1.60934;
        posts = posts.filter((p: Record<string, unknown>) => {
          const lat = p.latitude as number | null;
          const lng = p.longitude as number | null;
          if (!lat || !lng) return true; // include posts without location
          return haversineKm(userLat!, userLng!, lat, lng) <= radiusKm;
        });
      }

      return NextResponse.json({
        data: { posts, perspectives },
        meta: { total: posts.length + perspectives.length, feed_type: "nearby" },
      });
    }
  } catch {
    // Supabase unavailable
  }

  return NextResponse.json({
    data: { posts: [], perspectives: [] },
    meta: { total: 0, feed_type: "nearby" },
  });
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
