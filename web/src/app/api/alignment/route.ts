import { NextResponse } from "next/server";
import { SEED_ALIGNMENTS, getAlignmentsByTopic } from "@/lib/seed-data";
import { applyRateLimit, parseQuery, slugSchema } from "@/lib/api";
import { getSupabase } from "@/lib/supabase";
import { z } from "zod";

const alignmentQuerySchema = z
  .object({
    topic_id: slugSchema.optional(),
  })
  .strict();

export async function GET(request: Request) {
  const rateLimitResponse = applyRateLimit(request, "alignment");
  if (rateLimitResponse) return rateLimitResponse;

  const parsedQuery = parseQuery(request, alignmentQuerySchema);
  if (!parsedQuery.success) return parsedQuery.response;

  const topicId = parsedQuery.data.topic_id;

  try {
    const supabase = getSupabase();
    if (supabase) {
      let query = supabase.from("community_alignments").select("*");

      if (topicId) {
        query = query.eq("topic_id", topicId);
      }

      const { data, error } = await query;

      if (!error && data) {
        return NextResponse.json({ alignments: data });
      }
    }
  } catch {
    // Supabase unavailable — fall through to seed data
  }

  if (topicId) {
    const alignments = getAlignmentsByTopic(topicId);
    return NextResponse.json({ alignments });
  }

  return NextResponse.json({ alignments: SEED_ALIGNMENTS });
}
