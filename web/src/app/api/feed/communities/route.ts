import { NextResponse } from "next/server";
import { applyRateLimit, parseQuery, slugSchema } from "@/lib/api";
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
