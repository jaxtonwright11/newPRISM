import { NextResponse } from "next/server";
import { SEED_ALIGNMENTS, getAlignmentsByTopic } from "@/lib/seed-data";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const topicId = searchParams.get("topic_id");

  if (topicId) {
    const alignments = getAlignmentsByTopic(topicId);
    return NextResponse.json({ alignments });
  }

  return NextResponse.json({ alignments: SEED_ALIGNMENTS });
}
