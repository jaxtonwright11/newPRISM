import { NextResponse } from "next/server";
import { SEED_PERSPECTIVES } from "@/lib/seed-data";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const topic = searchParams.get("topic");

  let perspectives = SEED_PERSPECTIVES;
  if (topic) {
    perspectives = perspectives.filter((p) => p.topic_slug === topic);
  }

  const discoverPerspectives = perspectives.filter(
    (p) =>
      p.community.community_type !== "civic" &&
      p.community.community_type !== "rural"
  );

  return NextResponse.json({
    data: discoverPerspectives,
    meta: { total: discoverPerspectives.length, feed_type: "discover" },
  });
}
