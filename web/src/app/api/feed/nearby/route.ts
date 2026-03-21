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
  const rateLimitResponse = applyRateLimit(request, "feed-nearby");
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
          meta: { total: data.length, feed_type: "nearby" },
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

  return NextResponse.json({
    data: perspectives,
    meta: { total: perspectives.length, feed_type: "nearby" },
  });
}
