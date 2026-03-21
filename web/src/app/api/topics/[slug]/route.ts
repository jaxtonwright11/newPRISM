import { NextResponse } from "next/server";
import { applyRateLimit, slugSchema } from "@/lib/api";
import { getSupabase } from "@/lib/supabase";
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

  try {
    const supabase = getSupabase();
    if (supabase) {
      const { data: topic, error: topicError } = await supabase
        .from("topics")
        .select("*")
        .eq("slug", slug)
        .single();

      if (!topicError && topic) {
        const [perspectivesResult, alignmentsResult] = await Promise.all([
          supabase
            .from("perspectives")
            .select("*, community:communities(id, name, region, community_type, color_hex, verified)")
            .eq("topic_id", topic.id)
            .eq("verified", true)
            .order("created_at", { ascending: false }),
          supabase
            .from("community_alignments")
            .select("*")
            .eq("topic_id", topic.id),
        ]);

        const perspectives =
          !perspectivesResult.error && perspectivesResult.data
            ? perspectivesResult.data
            : [];
        const alignments =
          !alignmentsResult.error && alignmentsResult.data
            ? alignmentsResult.data
            : [];

        return NextResponse.json({ topic, perspectives, alignments });
      }
    }
  } catch {
    // Supabase unavailable — fall through to seed data
  }

  const topic = getTopicBySlug(slug);

  if (!topic) {
    return NextResponse.json({ error: "Topic not found" }, { status: 404 });
  }

  const perspectives = getPerspectivesByTopic(slug);
  const alignments = getAlignmentsByTopic(topic.id);

  return NextResponse.json({ topic, perspectives, alignments });
}
