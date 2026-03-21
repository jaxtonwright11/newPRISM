import { NextResponse } from "next/server";
import { SEED_PERSPECTIVES, getPerspectivesByTopic } from "@/lib/seed-data";
import { applyRateLimit, parseQuery, slugSchema } from "@/lib/api";
import { getSupabaseServer } from "@/lib/supabase";
import { z } from "zod";

const perspectivesQuerySchema = z
  .object({
    topic: slugSchema.optional(),
  })
  .strict();

export async function GET(request: Request) {
  const rateLimitResponse = applyRateLimit(request, "perspectives");
  if (rateLimitResponse) return rateLimitResponse;

  const parsedQuery = parseQuery(request, perspectivesQuerySchema);
  if (!parsedQuery.success) return parsedQuery.response;

  const topicSlug = parsedQuery.data.topic;

  try {
    const supabase = getSupabaseServer();
    if (supabase) {
      if (topicSlug) {
        const { data: topic } = await supabase
          .from("topics")
          .select("id")
          .eq("slug", topicSlug)
          .single();

        if (topic) {
          const { data, error } = await supabase
            .from("perspectives")
            .select("*, community:communities(*)")
            .eq("topic_id", topic.id)
            .eq("verified", true)
            .order("created_at", { ascending: false });

          if (!error && data) {
            return NextResponse.json({ perspectives: data });
          }
        }
      } else {
        const { data, error } = await supabase
          .from("perspectives")
          .select("*, community:communities(*)")
          .eq("verified", true)
          .order("created_at", { ascending: false });

        if (!error && data) {
          return NextResponse.json({ perspectives: data });
        }
      }
    }
  } catch {
    // Supabase unavailable — fall through to seed data
  }

  if (topicSlug) {
    const perspectives = getPerspectivesByTopic(topicSlug);
    return NextResponse.json({ perspectives });
  }

  return NextResponse.json({ perspectives: SEED_PERSPECTIVES });
}
