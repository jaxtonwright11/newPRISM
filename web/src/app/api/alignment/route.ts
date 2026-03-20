import { NextResponse } from "next/server";
import { SEED_ALIGNMENTS, getAlignmentsByTopic } from "@/lib/seed-data";
import { applyRateLimit, parseQuery, slugSchema } from "@/lib/api";
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

  if (topicId) {
    const alignments = getAlignmentsByTopic(topicId);
    return NextResponse.json({ alignments });
  }

  return NextResponse.json({ alignments: SEED_ALIGNMENTS });
}
