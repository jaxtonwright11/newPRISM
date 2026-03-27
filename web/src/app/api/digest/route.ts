import { NextResponse } from "next/server";
import { applyRateLimit } from "@/lib/api";
import { getSupabaseWithAuth } from "@/lib/supabase";

export async function GET(request: Request) {
  const rateLimitResponse = applyRateLimit(request, "digest");
  if (rateLimitResponse) return rateLimitResponse;

  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) {
    return NextResponse.json({ error: "Missing authorization" }, { status: 401 });
  }

  const supabase = getSupabaseWithAuth(token);
  if (!supabase) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // Get user's followed communities
  const { data: follows } = await supabase
    .from("community_follows")
    .select("community_id")
    .eq("user_id", user.id);

  const followedIds = (follows ?? []).map((f) => f.community_id);

  // Parallel queries for digest data
  const [perspectivesRes, topicsRes, connectionsRes] = await Promise.all([
    // New perspectives from followed communities this week
    followedIds.length > 0
      ? supabase
          .from("perspectives")
          .select("id, quote, community:communities(name, community_type, color_hex)")
          .in("community_id", followedIds)
          .eq("verified", true)
          .gte("created_at", oneWeekAgo)
          .order("reaction_count", { ascending: false })
          .limit(5)
      : Promise.resolve({ data: [], error: null }),

    // Hot/trending topics this week
    supabase
      .from("topics")
      .select("id, title, slug, status, community_count")
      .in("status", ["hot", "trending"])
      .order("community_count", { ascending: false })
      .limit(3),

    // New connection requests
    supabase
      .from("community_connections")
      .select("id, status")
      .eq("recipient_id", user.id)
      .eq("status", "pending")
      .gte("created_at", oneWeekAgo),
  ]);

  return NextResponse.json({
    digest: {
      period: { from: oneWeekAgo, to: new Date().toISOString() },
      top_perspectives: perspectivesRes.data ?? [],
      trending_topics: topicsRes.data ?? [],
      pending_connections: connectionsRes.data?.length ?? 0,
      followed_communities: followedIds.length,
    },
  });
}
