import { NextRequest, NextResponse } from "next/server";
import { applyRateLimit } from "@/lib/api";
import { getSupabase } from "@/lib/supabase";

/**
 * Suggest communities for onboarding: 2 geographically close + 3 diverse.
 * Query: ?lat=...&lng=... (optional — falls back to diverse-only selection)
 */
export async function GET(request: NextRequest) {
  const rateLimited = applyRateLimit(request, "community-suggest");
  if (rateLimited) return rateLimited;

  const { searchParams } = new URL(request.url);
  const lat = parseFloat(searchParams.get("lat") ?? "");
  const lng = parseFloat(searchParams.get("lng") ?? "");
  const hasCoords = !isNaN(lat) && !isNaN(lng);

  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ suggestions: [] });
  }

  try {
    // Get all active communities with coordinates
    const { data: communities, error } = await supabase
      .from("communities")
      .select("id, name, region, community_type, color_hex, latitude, longitude, description")
      .eq("active", true)
      .not("latitude", "is", null)
      .not("longitude", "is", null)
      .limit(200);

    if (error || !communities || communities.length === 0) {
      return NextResponse.json({ suggestions: [] });
    }

    // Get perspective counts per community
    const { data: perspectiveCounts } = await supabase
      .from("perspectives")
      .select("community_id")
      .limit(1000);

    const countMap: Record<string, number> = {};
    for (const p of perspectiveCounts ?? []) {
      countMap[p.community_id] = (countMap[p.community_id] || 0) + 1;
    }

    // Get a sample perspective quote per community (most recent)
    const communityIds = communities.map((c) => c.id);
    const { data: samplePerspectives } = await supabase
      .from("perspectives")
      .select("community_id, quote")
      .in("community_id", communityIds)
      .order("created_at", { ascending: false })
      .limit(200);

    const quoteMap: Record<string, string> = {};
    for (const p of samplePerspectives ?? []) {
      if (!quoteMap[p.community_id]) {
        quoteMap[p.community_id] = p.quote;
      }
    }

    // Get follower counts
    const { data: followerCounts } = await supabase
      .from("community_follows")
      .select("community_id")
      .limit(2000);

    const followerMap: Record<string, number> = {};
    for (const f of followerCounts ?? []) {
      followerMap[f.community_id] = (followerMap[f.community_id] || 0) + 1;
    }

    type SuggestedCommunity = {
      id: string;
      name: string;
      region: string;
      community_type: string;
      color_hex: string;
      latitude: number;
      longitude: number;
      description: string | null;
      perspective_count: number;
      member_count: number;
      sample_quote: string | null;
      distance_km: number | null;
    };

    function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
      const R = 6371;
      const dLat = ((lat2 - lat1) * Math.PI) / 180;
      const dLon = ((lon2 - lon1) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    const enriched: SuggestedCommunity[] = communities.map((c) => ({
      id: c.id,
      name: c.name,
      region: c.region,
      community_type: c.community_type,
      color_hex: c.color_hex,
      latitude: c.latitude!,
      longitude: c.longitude!,
      description: c.description,
      perspective_count: countMap[c.id] ?? 0,
      member_count: followerMap[c.id] ?? 0,
      sample_quote: quoteMap[c.id] ?? null,
      distance_km: hasCoords ? haversine(lat, lng, c.latitude!, c.longitude!) : null,
    }));

    const suggestions: SuggestedCommunity[] = [];
    const usedIds = new Set<string>();
    const usedTypes = new Set<string>();

    // Pick 2 nearest communities (if coordinates available)
    if (hasCoords) {
      const byDistance = [...enriched].sort((a, b) => (a.distance_km ?? Infinity) - (b.distance_km ?? Infinity));
      for (const c of byDistance) {
        if (suggestions.length >= 2) break;
        suggestions.push(c);
        usedIds.add(c.id);
        usedTypes.add(c.community_type);
      }
    }

    // Pick 3 diverse communities (different types from what's already selected)
    const byActivity = [...enriched]
      .filter((c) => !usedIds.has(c.id))
      .sort((a, b) => b.perspective_count - a.perspective_count);

    for (const c of byActivity) {
      if (suggestions.length >= 5) break;
      // Prioritize type diversity
      if (usedTypes.has(c.community_type) && byActivity.some((x) => !usedIds.has(x.id) && !usedTypes.has(x.community_type))) {
        continue;
      }
      suggestions.push(c);
      usedIds.add(c.id);
      usedTypes.add(c.community_type);
    }

    // Fill remaining slots if we couldn't hit 5 with diversity
    if (suggestions.length < 5) {
      for (const c of byActivity) {
        if (suggestions.length >= 5) break;
        if (!usedIds.has(c.id)) {
          suggestions.push(c);
          usedIds.add(c.id);
        }
      }
    }

    const res = NextResponse.json({ suggestions });
    res.headers.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
    return res;
  } catch {
    return NextResponse.json({ suggestions: [] });
  }
}
