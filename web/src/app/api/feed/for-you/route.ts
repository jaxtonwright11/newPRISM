import { NextResponse } from "next/server";
import { applyRateLimit } from "@/lib/api";
import { getSupabase, getSupabaseWithAuth } from "@/lib/supabase";

export async function GET(request: Request) {
  const rateLimitResponse = applyRateLimit(request, "feed-for-you");
  if (rateLimitResponse) return rateLimitResponse;

  const url = new URL(request.url);
  const offset = Math.max(0, parseInt(url.searchParams.get("offset") ?? "0") || 0);
  const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get("limit") ?? "30") || 30));

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
        .range(offset, offset + limit - 1);

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
        .range(offset, offset + limit - 1);

      return NextResponse.json({
        data: data ?? [],
        meta: { total: data?.length ?? 0, feed_type: "for-you" },
      });
    }

    // Get followed community IDs and home community in parallel
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

    const followedIds: string[] = [];
    if (follows) {
      for (const f of follows) followedIds.push(f.community_id);
    }

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

    // Score and rank perspectives for engagement
    const scorePerspective = (p: Record<string, unknown>, isFollowed: boolean) => {
      const reactions = (p.reaction_count as number) || 0;
      const bookmarks = (p.bookmark_count as number) || 0;
      const createdAt = p.created_at ? new Date(p.created_at as string).getTime() : 0;
      const hoursAgo = (Date.now() - createdAt) / (1000 * 60 * 60);

      // Engagement score: reactions weighted higher than bookmarks
      const engagement = reactions * 2 + bookmarks * 3;

      // Recency decay: lose ~50% score per 24 hours
      const recencyMultiplier = Math.max(0.1, 1 / (1 + hoursAgo / 24));

      // Followed community boost
      const followBoost = isFollowed ? 1.5 : 1;

      return engagement * recencyMultiplier * followBoost + recencyMultiplier * 10;
    };

    // Score all perspectives
    type Scored = Record<string, unknown> & { _score: number };
    const scoredFollowed: Scored[] = followed.map((p) => ({ ...p, _score: scorePerspective(p, true) }));
    const scoredDiscover: Scored[] = discover.map((p) => ({ ...p, _score: scorePerspective(p, false) }));

    // Interleave with diversity: 2 followed, 1 discover, each sorted by score
    scoredFollowed.sort((a, b) => b._score - a._score);
    scoredDiscover.sort((a, b) => b._score - a._score);

    const blended: Record<string, unknown>[] = [];
    const seenCommunities = new Set<string>();
    let fi = 0, di = 0;

    while (fi < scoredFollowed.length || di < scoredDiscover.length) {
      // Add up to 2 from followed
      for (let i = 0; i < 2 && fi < scoredFollowed.length; fi++) {
        const p = scoredFollowed[fi];
        const communityId = (p.community as Record<string, unknown>)?.id as string;
        // Soft diversity: deprioritize but don't skip same community in a row
        if (!seenCommunities.has(communityId) || blended.length < 6) {
          blended.push(p);
          seenCommunities.add(communityId);
          i++;
        } else {
          blended.push(p);
          i++;
        }
      }
      // Add 1 from discover — prefer unseen communities
      for (let attempts = 0; di < scoredDiscover.length && attempts < 3; di++, attempts++) {
        const p = scoredDiscover[di];
        const communityId = (p.community as Record<string, unknown>)?.id as string;
        blended.push(p);
        seenCommunities.add(communityId);
        di++;
        break;
      }
    }

    // Strip internal score
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const result = blended.map(({ _score, ...rest }) => rest);

    return NextResponse.json({
      data: result,
      meta: { total: result.length, feed_type: "for-you" },
    });
  } catch {
    // Supabase unavailable
  }

  return NextResponse.json({
    data: [],
    meta: { total: 0, feed_type: "for-you" },
  });
}
