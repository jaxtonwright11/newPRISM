import { NextResponse } from "next/server";
import { applyRateLimit, parseQuery, slugSchema } from "@/lib/api";
import { getSupabaseServer } from "@/lib/supabase";
import { SEED_PERSPECTIVES } from "@/lib/seed-data";
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

  try {
    const supabase = getSupabaseServer();
    if (supabase) {
      let query = supabase
        .from("perspectives")
        .select("*, community:communities(*)")
        .eq("verified", true)
        .in("community.community_type", ["civic", "rural"])
        .order("created_at", { ascending: false });

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
        // PostgREST embedded filters may return nulls for non-matching joins;
        // filter out rows where the community didn't match the type filter.
        const filtered = data.filter((p: Record<string, unknown>) => p.community !== null);
        return NextResponse.json({
          data: filtered,
          meta: { total: filtered.length, feed_type: "communities" },
        });
      }
    }
  } catch {
    // Supabase unavailable — fall through to seed data
  }

  let perspectives = SEED_PERSPECTIVES;
  if (topic) {
    perspectives = perspectives.filter((p) => p.topic_slug === topic);
  }

  const communityPerspectives = perspectives.filter(
    (p) => p.community.community_type === "civic" || p.community.community_type === "rural"
  );

  return NextResponse.json({
    data: communityPerspectives,
    meta: { total: communityPerspectives.length, feed_type: "communities" },
  });
}
