import { NextResponse } from "next/server";
import { SEED_PERSPECTIVES, getPerspectivesByTopic } from "@/lib/seed-data";
import { applyRateLimit, parseQuery, slugSchema } from "@/lib/api";
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

  if (topicSlug) {
    const perspectives = getPerspectivesByTopic(topicSlug);
    return NextResponse.json({ perspectives });
  }

  return NextResponse.json({ perspectives: SEED_PERSPECTIVES });
}
