import { NextResponse } from "next/server";

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

      const { data, error } = await query.limit(200);

      if (!error && data) {
        const res = NextResponse.json({ alignments: data });
        res.headers.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
        return res;
      }
    }
  } catch {
    // Supabase unavailable
  }

  return NextResponse.json({ alignments: [] });
}
