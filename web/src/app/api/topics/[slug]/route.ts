import { NextResponse } from "next/server";
import { applyRateLimit, slugSchema } from "@/lib/api";
import {
  getTopicBySlug,
  getPerspectivesByTopic,
  getAlignmentsByTopic,
} from "@/lib/seed-data";
import { z } from "zod";

const topicParamsSchema = z.object({
  slug: slugSchema,
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const rateLimitResponse = applyRateLimit(request, "topics-by-slug");
  if (rateLimitResponse) return rateLimitResponse;

  const parsedParams = topicParamsSchema.safeParse(await params);
  if (!parsedParams.success) {
    return NextResponse.json({ error: "Invalid topic slug" }, { status: 400 });
  }

  const { slug } = parsedParams.data;
  const topic = getTopicBySlug(slug);

  if (!topic) {
    return NextResponse.json({ error: "Topic not found" }, { status: 404 });
  }

  const perspectives = getPerspectivesByTopic(slug);
  const alignments = getAlignmentsByTopic(topic.id);

  return NextResponse.json({ topic, perspectives, alignments });
}
