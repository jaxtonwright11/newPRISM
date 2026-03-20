import { NextResponse } from "next/server";
import { SEED_PERSPECTIVES } from "@/lib/seed-data";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const topic = searchParams.get("topic");

  let perspectives = SEED_PERSPECTIVES;
  if (topic) {
    perspectives = perspectives.filter((p) => p.topic_slug === topic);
  }

  return NextResponse.json({
    data: perspectives,
    meta: { total: perspectives.length, feed_type: "nearby" },
  });
}
