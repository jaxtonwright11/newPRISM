import { NextResponse } from "next/server";
import { applyRateLimit } from "@/lib/api";
import { getSupabase, getSupabaseWithAuth } from "@/lib/supabase";

export async function GET(request: Request) {
  const rateLimitResponse = applyRateLimit(request, "feed-for-you");
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    const supabase = token ? getSupabaseWithAuth(token) : getSupabase();

    if (!supabase) {
      return NextResponse.json({ data: [], meta: { total: 0, feed_type: "for-you" } });
    }

    // For unauthenticated users, just return recent verified perspectives
    if (!token) {
      const { data, error } = await supabase
        .from("perspectives")
        .select("*, community:communities!inner(id, name, region, community_type, color_hex, verified)")
        .eq("verified", true)
        .order("created_at", { ascending: false })
        .limit(30);

      if (!error && data) {
        return NextResponse.json({
          data,
          meta: { total: data.length, feed_type: "for-you" },
        });
      }
    }

    // For authenticated users, blend followed + discover perspectives
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      // Fall back to public feed
      const { data } = await supabase
        .from("perspectives")
        .select("*, community:communities!inner(id, name, region, community_type, color_hex, verified)")
        .eq("verified", true)
        .order("created_at", { ascending: false })
        .limit(30);

      return NextResponse.json({
        data: data ?? [],
        meta: { total: data?.length ?? 0, feed_type: "for-you" },
      });
    }

    // Get followed community IDs
    const followedIds: string[] = [];
    const { data: follows } = await supabase
      .from("community_follows")
      .select("community_id")
      .eq("user_id", user.id);

    if (follows) {
      for (const f of follows) followedIds.push(f.community_id);
    }

    const { data: userData } = await supabase
      .from("users")
      .select("home_community_id")
      .eq("id", user.id)
      .single();

    if (userData?.home_community_id && !followedIds.includes(userData.home_community_id)) {
      followedIds.push(userData.home_community_id);
    }

    // Fetch two streams in parallel: followed communities + new communities
    const [followedRes, discoverRes] = await Promise.all([
      followedIds.length > 0
        ? supabase
            .from("perspectives")
            .select("*, community:communities!inner(id, name, region, community_type, color_hex, verified)")
            .eq("verified", true)
            .in("community_id", followedIds)
            .order("created_at", { ascending: false })
            .limit(15)
        : Promise.resolve({ data: [] as unknown[], error: null }),
      followedIds.length > 0
        ? supabase
            .from("perspectives")
            .select("*, community:communities!inner(id, name, region, community_type, color_hex, verified)")
            .eq("verified", true)
            .not("community_id", "in", `(${followedIds.join(",")})`)
            .order("created_at", { ascending: false })
            .limit(15)
        : supabase
            .from("perspectives")
            .select("*, community:communities!inner(id, name, region, community_type, color_hex, verified)")
            .eq("verified", true)
            .order("created_at", { ascending: false })
            .limit(30),
    ]);

    const followed = (followedRes.data ?? []) as Record<string, unknown>[];
    const discover = (discoverRes.data ?? []) as Record<string, unknown>[];

    // Interleave: 2 followed, 1 discover, repeat — ensures variety
    const blended: Record<string, unknown>[] = [];
    let fi = 0, di = 0;
    while (fi < followed.length || di < discover.length) {
      if (fi < followed.length) blended.push(followed[fi++]);
      if (fi < followed.length) blended.push(followed[fi++]);
      if (di < discover.length) blended.push(discover[di++]);
    }

    return NextResponse.json({
      data: blended,
      meta: { total: blended.length, feed_type: "for-you" },
    });
  } catch {
    // Supabase unavailable
  }

  return NextResponse.json({
    data: [],
    meta: { total: 0, feed_type: "for-you" },
  });
}
