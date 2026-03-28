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

    // Interleave with diversity: 2 followed, 1 discover, each sorted by score.
    // Apply a community-type diversity penalty: if the last 2 items in the
    // output share the same community_type, penalize candidates of that type
    // so the feed surfaces varied community types (civic, diaspora, rural, etc.).
    scoredFollowed.sort((a, b) => b._score - a._score);
    scoredDiscover.sort((a, b) => b._score - a._score);

    const blended: Scored[] = [];
    let fi = 0, di = 0;

    /** Returns community_type of a scored perspective */
    const getCommunityType = (p: Scored): string =>
      ((p.community as Record<string, unknown>)?.community_type as string) ?? "";

    /** Check if adding this type would create 3 of the same type in a row */
    const wouldTriplicate = (candidateType: string): boolean => {
      if (blended.length < 2) return false;
      const last = getCommunityType(blended[blended.length - 1]);
      const secondLast = getCommunityType(blended[blended.length - 2]);
      return last === candidateType && secondLast === candidateType;
    };

    /** Pick the best non-triplicating candidate from a sorted array starting at idx */
    const pickDiverse = (arr: Scored[], startIdx: number): { item: Scored; nextIdx: number } | null => {
      // First try to find one that doesn't triplicate within 3 lookahead
      for (let look = 0; look < 3 && startIdx + look < arr.length; look++) {
        const candidate = arr[startIdx + look];
        if (!wouldTriplicate(getCommunityType(candidate))) {
          // Swap it to current position for simple index advance
          if (look > 0) {
            arr[startIdx + look] = arr[startIdx];
            arr[startIdx] = candidate;
          }
          return { item: candidate, nextIdx: startIdx + 1 };
        }
      }
      // Fall back to just taking the next one
      if (startIdx < arr.length) {
        return { item: arr[startIdx], nextIdx: startIdx + 1 };
      }
      return null;
    };

    while (fi < scoredFollowed.length || di < scoredDiscover.length) {
      // Add up to 2 from followed
      for (let i = 0; i < 2 && fi < scoredFollowed.length; i++) {
        const pick = pickDiverse(scoredFollowed, fi);
        if (!pick) break;
        blended.push(pick.item);
        fi = pick.nextIdx;
      }
      // Add 1 from discover
      if (di < scoredDiscover.length) {
        const pick = pickDiverse(scoredDiscover, di);
        if (pick) {
          blended.push(pick.item);
          di = pick.nextIdx;
        }
      }
    }

    // Strip internal score
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const result = blended.map(({ _score, ...rest }) => rest);

    // Cursor-based pagination: return the created_at of the last item as next_cursor
    const page = result.slice(offset, offset + limit);
    const lastItem = page[page.length - 1] as Record<string, unknown> | undefined;
    const nextCursor = lastItem?.created_at as string | undefined;

    return NextResponse.json({
      data: page,
      meta: {
        total: result.length,
        feed_type: "for-you",
        next_cursor: page.length === limit ? nextCursor : null,
        has_more: offset + limit < result.length,
      },
    });
  } catch {
    // Supabase unavailable
  }

  return NextResponse.json({
    data: [],
    meta: { total: 0, feed_type: "for-you" },
  });
}
