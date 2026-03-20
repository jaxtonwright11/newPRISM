import { NextResponse } from "next/server";
import {
  getTopicBySlug,
  getPerspectivesByTopic,
  getAlignmentsByTopic,
} from "@/lib/seed-data";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const topic = getTopicBySlug(slug);

  if (!topic) {
    return NextResponse.json({ error: "Topic not found" }, { status: 404 });
  }

  const perspectives = getPerspectivesByTopic(slug);
  const alignments = getAlignmentsByTopic(topic.id);

  return NextResponse.json({ topic, perspectives, alignments });
}
