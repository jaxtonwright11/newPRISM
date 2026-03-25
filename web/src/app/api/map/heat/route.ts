import { NextRequest, NextResponse } from "next/server";
import { applyRateLimit } from "@/lib/api";
import { getSupabase } from "@/lib/supabase";
import { z } from "zod";

const querySchema = z.object({
  topic_id: z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i).optional(),
});

export async function GET(request: NextRequest) {
  const rateLimited = applyRateLimit(request, "map-heat");
  if (rateLimited) return rateLimited;

  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({ topic_id: searchParams.get("topic_id") ?? undefined });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query parameters" }, { status: 400 });
  }
  const topicId = parsed.data.topic_id ?? null;

  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ heat_points: [] });
  }

  try {
    // Get perspectives grouped by community for the given topic (or all topics)
    let query = supabase
      .from("perspectives")
      .select("topic_id, community:communities(id, latitude, longitude, community_type, color_hex, name, region)");

    if (topicId) {
      query = query.eq("topic_id", topicId);
    }

    const { data: perspectives, error } = await query.limit(500);

    if (error || !perspectives) {
      return NextResponse.json({ heat_points: [] });
    }

    // Group by geographic region (rounded lat/lng to cluster nearby communities)
    const clusters: Record<string, {
      latitude: number;
      longitude: number;
      community_count: number;
      community_ids: Set<string>;
      community_types: Set<string>;
      topic_ids: Set<string>;
    }> = {};

    for (const p of perspectives) {
      const comm = p.community as unknown as { id: string; latitude: number | null; longitude: number | null; community_type: string; color_hex: string; name: string; region: string } | null;
      if (!comm?.latitude || !comm?.longitude) continue;

      // Cluster by rounding to ~50 mile grid
      const clusterKey = `${Math.round(comm.latitude)}_${Math.round(comm.longitude)}`;

      if (!clusters[clusterKey]) {
        clusters[clusterKey] = {
          latitude: comm.latitude,
          longitude: comm.longitude,
          community_count: 0,
          community_ids: new Set(),
          community_types: new Set(),
          topic_ids: new Set(),
        };
      }

      const cluster = clusters[clusterKey];
      if (!cluster.community_ids.has(comm.id)) {
        cluster.community_ids.add(comm.id);
        cluster.community_count++;
      }
      cluster.community_types.add(comm.community_type);
      cluster.topic_ids.add(p.topic_id);
    }

    const heat_points = Object.values(clusters)
      .filter((c) => c.community_count >= 2)
      .map((c) => ({
        latitude: c.latitude,
        longitude: c.longitude,
        intensity: Math.min(c.community_count / 5, 1), // Normalize 0-1, max at 5 communities
        community_count: c.community_count,
        community_types: Array.from(c.community_types),
        topic_count: c.topic_ids.size,
      }))
      .sort((a, b) => b.community_count - a.community_count);

    const res = NextResponse.json({ heat_points });
    res.headers.set("Cache-Control", "public, s-maxage=30, stale-while-revalidate=120");
    return res;
  } catch {
    return NextResponse.json({ heat_points: [] });
  }
}
