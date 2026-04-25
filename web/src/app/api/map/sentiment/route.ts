import { NextRequest, NextResponse } from "next/server";
import { applyRateLimit } from "@/lib/api";
import { getSupabase } from "@/lib/supabase";
import { z } from "zod";
import type { CommunitySentiment } from "@shared/map-sentiment";

const querySchema = z.object({
  topic_id: z.string().uuid(),
});

export async function GET(request: NextRequest) {
  const rateLimited = applyRateLimit(request, "map-sentiment");
  if (rateLimited) return rateLimited;

  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({
    topic_id: searchParams.get("topic_id") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "topic_id (UUID) is required" }, { status: 400 });
  }

  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ sentiments: [] });
  }

  try {
    // Get all perspectives for this topic with their community + reactions
    const { data: perspectives, error } = await supabase
      .from("perspectives")
      .select(`
        id,
        community_id,
        community:communities(id, name, community_type, latitude, longitude, region)
      `)
      .eq("topic_id", parsed.data.topic_id)
      .limit(500);

    if (error || !perspectives) {
      return NextResponse.json({ sentiments: [] });
    }

    // Get reactions for these perspectives
    const perspectiveIds = perspectives.map((p) => p.id);
    const { data: reactions } = perspectiveIds.length > 0
      ? await supabase
          .from("reactions")
          .select("perspective_id, reaction_type")
          .in("perspective_id", perspectiveIds)
      : { data: [] };

    // Build per-perspective reaction lookup
    const perspectiveReactions: Record<string, Record<string, number>> = {};
    for (const r of reactions ?? []) {
      if (!perspectiveReactions[r.perspective_id]) {
        perspectiveReactions[r.perspective_id] = {
          i_see_this: 0,
          i_didnt_know_this: 0,
          i_agree: 0,
        };
      }
      perspectiveReactions[r.perspective_id][r.reaction_type] =
        (perspectiveReactions[r.perspective_id][r.reaction_type] || 0) + 1;
    }

    // Aggregate by community
    const communityMap: Record<string, CommunitySentiment> = {};

    for (const p of perspectives) {
      const comm = p.community as unknown as {
        id: string;
        name: string;
        community_type: string;
        latitude: number | null;
        longitude: number | null;
        region: string;
      } | null;
      if (!comm?.latitude || !comm?.longitude) continue;

      if (!communityMap[comm.id]) {
        communityMap[comm.id] = {
          community_id: comm.id,
          community_name: comm.name,
          community_type: comm.community_type,
          latitude: comm.latitude,
          longitude: comm.longitude,
          region: comm.region,
          perspective_count: 0,
          dominant_reaction: "i_see_this",
          reaction_counts: { i_see_this: 0, i_didnt_know_this: 0, i_agree: 0 },
        };
      }

      communityMap[comm.id].perspective_count++;

      const pReactions = perspectiveReactions[p.id];
      if (pReactions) {
        communityMap[comm.id].reaction_counts.i_see_this += pReactions.i_see_this || 0;
        communityMap[comm.id].reaction_counts.i_didnt_know_this += pReactions.i_didnt_know_this || 0;
        communityMap[comm.id].reaction_counts.i_agree += pReactions.i_agree || 0;
      }
    }

    // Determine dominant reaction per community
    const sentiments = Object.values(communityMap).map((cs) => {
      const { i_see_this, i_didnt_know_this, i_agree } = cs.reaction_counts;
      const max = Math.max(i_see_this, i_didnt_know_this, i_agree);
      if (max === 0) {
        cs.dominant_reaction = "i_see_this"; // default
      } else if (max === i_didnt_know_this) {
        cs.dominant_reaction = "i_didnt_know_this";
      } else if (max === i_agree) {
        cs.dominant_reaction = "i_agree";
      } else {
        cs.dominant_reaction = "i_see_this";
      }
      return cs;
    });

    const res = NextResponse.json({ sentiments });
    res.headers.set("Cache-Control", "public, s-maxage=30, stale-while-revalidate=120");
    return res;
  } catch {
    return NextResponse.json({ sentiments: [] });
  }
}
