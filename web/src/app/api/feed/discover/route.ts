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
  const rateLimitResponse = applyRateLimit(request, "feed-discover");
  if (rateLimitResponse) return rateLimitResponse;

  const parsedQuery = parseQuery(request, feedQuerySchema);
  if (!parsedQuery.success) return parsedQuery.response;

  const topic = parsedQuery.data.topic;

  try {
    const supabase = getSupabaseServer();
    if (supabase) {
      // Get perspectives whose community is NOT civic or rural
      let query = supabase
        .from("perspectives")
        .select("*, community:communities!inner(*)")
        .eq("verified", true)
        .not("community.community_type", "in", '("civic","rural")')
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
        return NextResponse.json({
          data,
          meta: { total: data.length, feed_type: "discover" },
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
