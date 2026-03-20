import { NextResponse } from "next/server";
import { SEED_PERSPECTIVES, getPerspectivesByTopic } from "@/lib/seed-data";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const topicSlug = searchParams.get("topic");

  if (topicSlug) {
    const perspectives = getPerspectivesByTopic(topicSlug);
    return NextResponse.json({ perspectives });
  }

  return NextResponse.json({ perspectives: SEED_PERSPECTIVES });
}
